use tauri::{
    menu::{CheckMenuItemBuilder, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

const MAIN_WINDOW: &str = "main";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let detection_toggle = CheckMenuItemBuilder::with_id("toggle_detection", "자세 감지")
                .checked(true)
                .build(app)?;
            let show_window = MenuItem::with_id(app, "show", "창 보이기", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Turtle 종료", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&detection_toggle, &show_window, &separator, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    "toggle_detection" => {
                        let enabled = detection_toggle.is_checked().unwrap_or(true);
                        let _ = app.emit("posture-detection-toggled", enabled);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Keep Turtle (and its webcam/pose-detection loop) running in the
            // background instead of quitting when the debug window is closed —
            // this is what lets the tray's "자세 감지" toggle mean anything.
            if window.label() == MAIN_WINDOW {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    window.hide().ok();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
