use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

const API_BASE: &str = "https://music-api.gdstudio.xyz/api.php";
const UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MusicDesktop/0.1";

// ---------- 安装目录 cache_dir/audio ----------

/// 可执行文件所在目录下的 `cache_dir/audio`
fn audio_cache_dir() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| format!("无法定位程序路径: {e}"))?;
    let parent = exe
        .parent()
        .ok_or_else(|| "无法解析安装目录".to_string())?;
    let dir = parent.join("cache_dir").join("audio");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建缓存目录失败: {e}"))?;
    Ok(dir)
}

fn sanitize_cache_token(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
            out.push(c);
        } else {
            out.push('_');
        }
    }
    if out.is_empty() {
        out.push_str("unknown");
    }
    // 防止过长文件名
    if out.len() > 80 {
        out.truncate(80);
    }
    out
}

fn cache_stem(source: &str, id: &str, br: u32) -> String {
    format!(
        "{}_{}_{}",
        sanitize_cache_token(source),
        sanitize_cache_token(id),
        br
    )
}

/// 在缓存目录中查找已存在的音频文件
fn find_existing_cache_file(dir: &Path, stem: &str) -> Option<PathBuf> {
    let rd = std::fs::read_dir(dir).ok()?;
    for ent in rd.flatten() {
        let path = ent.path();
        if !path.is_file() {
            continue;
        }
        let name = path.file_name()?.to_string_lossy();
        // 跳过下载中的临时文件
        if name.ends_with(".part") {
            continue;
        }
        if let Some(file_stem) = path.file_stem().and_then(|s| s.to_str()) {
            if file_stem == stem {
                // 过滤空文件
                if let Ok(meta) = path.metadata() {
                    if meta.len() > 0 {
                        return Some(path);
                    }
                }
            }
        }
    }
    None
}

fn ext_from_url(url: &str) -> Option<&'static str> {
    let path = url.split('?').next().unwrap_or(url);
    let lower = path.to_ascii_lowercase();
    if lower.ends_with(".flac") {
        Some("flac")
    } else if lower.ends_with(".m4a") || lower.ends_with(".mp4") {
        Some("m4a")
    } else if lower.ends_with(".ogg") || lower.ends_with(".oga") {
        Some("ogg")
    } else if lower.ends_with(".wav") {
        Some("wav")
    } else if lower.ends_with(".aac") {
        Some("aac")
    } else if lower.ends_with(".mp3") {
        Some("mp3")
    } else {
        None
    }
}

fn ext_from_content_type(ct: &str) -> Option<&'static str> {
    let ct = ct.to_ascii_lowercase();
    if ct.contains("flac") {
        Some("flac")
    } else if ct.contains("mp4") || ct.contains("m4a") || ct.contains("aac") {
        Some("m4a")
    } else if ct.contains("ogg") {
        Some("ogg")
    } else if ct.contains("wav") {
        Some("wav")
    } else if ct.contains("mpeg") || ct.contains("mp3") {
        Some("mp3")
    } else {
        None
    }
}

/// 代理 GD Studio API，规避 WebView CORS
#[tauri::command]
async fn proxy_api(params: HashMap<String, String>) -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(API_BASE)
        .query(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("API HTTP {}", resp.status()));
    }

    let text = resp.text().await.map_err(|e| e.to_string())?;
    if text.trim().is_empty() || text.trim() == "null" {
        return Ok(Value::Null);
    }

    serde_json::from_str(&text).map_err(|e| format!("JSON parse error: {e}; body={text}"))
}

/// 将音频直链下载到用户选择的路径
#[tauri::command]
async fn download_file(url: String, path: String) -> Result<(), String> {
    if url.trim().is_empty() {
        return Err("下载地址为空".into());
    }
    let dest = PathBuf::from(&path);
    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {e}"))?;
        }
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("下载 HTTP {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("读取内容失败: {e}"))?;

    if bytes.is_empty() {
        return Err("下载内容为空".into());
    }

    std::fs::write(&dest, &bytes).map_err(|e| format!("写入文件失败: {e}"))?;
    Ok(())
}

/// 返回音频缓存目录（安装目录/cache_dir/audio）
#[tauri::command]
fn get_audio_cache_dir() -> Result<String, String> {
    audio_cache_dir().map(|p| p.to_string_lossy().into_owned())
}

/// 若已缓存则返回绝对路径，否则 null
#[tauri::command]
fn find_cached_audio(source: String, id: String, br: u32) -> Result<Option<String>, String> {
    let dir = audio_cache_dir()?;
    let stem = cache_stem(&source, &id, br);
    Ok(find_existing_cache_file(&dir, &stem).map(|p| p.to_string_lossy().into_owned()))
}

/// 下载远程音频到缓存目录；已存在则直接返回路径
#[tauri::command]
async fn cache_audio_file(
    source: String,
    id: String,
    br: u32,
    url: String,
) -> Result<String, String> {
    if url.trim().is_empty() {
        return Err("下载地址为空".into());
    }
    // 仅允许 http(s)
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("仅支持 http(s) 音频地址".into());
    }

    let dir = audio_cache_dir()?;
    let stem = cache_stem(&source, &id, br);
    if let Some(existing) = find_existing_cache_file(&dir, &stem) {
        return Ok(existing.to_string_lossy().into_owned());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(180))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("缓存下载失败: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("缓存下载 HTTP {}", resp.status()));
    }

    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let ext = ext_from_url(&url)
        .or_else(|| ext_from_content_type(&content_type))
        .unwrap_or("mp3");

    let final_path = dir.join(format!("{stem}.{ext}"));
    let part_path = dir.join(format!("{stem}.{ext}.part"));

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("读取音频失败: {e}"))?;
    if bytes.is_empty() {
        return Err("缓存内容为空".into());
    }

    // 下载期间若已被其它任务写好，直接复用
    if let Some(existing) = find_existing_cache_file(&dir, &stem) {
        let _ = std::fs::remove_file(&part_path);
        return Ok(existing.to_string_lossy().into_owned());
    }

    std::fs::write(&part_path, &bytes).map_err(|e| format!("写入缓存失败: {e}"))?;
    if final_path.exists() {
        let _ = std::fs::remove_file(&final_path);
    }
    if let Err(e) = std::fs::rename(&part_path, &final_path) {
        let _ = std::fs::remove_file(&part_path);
        return Err(format!("写入缓存失败: {e}"));
    }

    Ok(final_path.to_string_lossy().into_owned())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CacheStats {
    path: String,
    file_count: u64,
    total_bytes: u64,
}

#[tauri::command]
fn get_audio_cache_stats() -> Result<CacheStats, String> {
    let dir = audio_cache_dir()?;
    let mut file_count = 0u64;
    let mut total_bytes = 0u64;
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for ent in rd.flatten() {
            let path = ent.path();
            if !path.is_file() {
                continue;
            }
            let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
            if name.ends_with(".part") {
                continue;
            }
            if let Ok(meta) = path.metadata() {
                file_count += 1;
                total_bytes += meta.len();
            }
        }
    }
    Ok(CacheStats {
        path: dir.to_string_lossy().into_owned(),
        file_count,
        total_bytes,
    })
}

/// 清空音频缓存，返回删除的文件数
#[tauri::command]
fn clear_audio_cache() -> Result<u64, String> {
    let dir = audio_cache_dir()?;
    let mut removed = 0u64;
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for ent in rd.flatten() {
            let path = ent.path();
            if path.is_file() && std::fs::remove_file(&path).is_ok() {
                removed += 1;
            }
        }
    }
    Ok(removed)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            proxy_api,
            download_file,
            get_audio_cache_dir,
            find_cached_audio,
            cache_audio_file,
            get_audio_cache_stats,
            clear_audio_cache
        ])
        .setup(|app| {
            // 允许 WebView 通过 asset 协议播放 cache_dir 内文件
            if let Ok(dir) = audio_cache_dir() {
                let _ = app.asset_protocol_scope().allow_directory(&dir, true);
            }

            let show_i = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let play_i = MenuItem::with_id(app, "toggle", "播放 / 暂停", true, None::<&str>)?;
            let prev_i = MenuItem::with_id(app, "prev", "上一首", true, None::<&str>)?;
            let next_i = MenuItem::with_id(app, "next", "下一首", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_i, &play_i, &prev_i, &next_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Music Desktop")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    "toggle" => {
                        let _ = app.emit("player:cmd", "toggle");
                    }
                    "prev" => {
                        let _ = app.emit("player:cmd", "prev");
                    }
                    "next" => {
                        let _ = app.emit("player:cmd", "next");
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.unminimize();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
