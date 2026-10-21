// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    userskhoanguyenworkingspersonaldb_nerd_lib::run()
}
