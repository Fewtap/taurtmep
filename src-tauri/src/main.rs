// Prevents additional console window on Windows in release, DO NOT REMOVE!!

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpStream;
use std::io::Write;
use std::io::Read;





fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![hello_name,update_zone,get_all_zones])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn hello_name(name: &str) -> String {
  format!("Hello, {}!",name)
}



#[tauri::command]
fn update_zone(ip: &str, port: &str, serial: &str, update_string: &str) -> Result<bool, String> {
  let mut stream = TcpStream::connect(format!("{}:{}", ip, port)).map_err(|e| format!("Error connecting to socket: {}", e))?;

  let current_time = chrono::Local::now().format("%Y%m%d%H%M%S").to_string();
  let message = format!("HELLO 1.1 {} {}", serial, current_time);

  stream.write_all(message.as_bytes()).map_err(|e| format!("Error sending data to socket: {}", e))?;

  let mut buffer = [0; 1024];
  stream.read(&mut buffer).map_err(|e| format!("Error reading response from socket: {}", e))?;

  let response = String::from_utf8_lossy(&buffer[..]);
  if response.contains("HELLO") {
    stream.write_all(update_string.as_bytes()).map_err(|e| format!("Error sending data to socket: {}", e))?;
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).map_err(|e| format!("Error reading response from socket: {}", e))?;

    let response = String::from_utf8_lossy(&buffer[..]);
    if response.contains("V00") {
      Ok(true)
    } else {
      Err(format!("Error updating socket"))
    }
  } else {
    Err(format!("Error connecting to socket"))
  }
}



#[tauri::command]
fn get_all_zones(ip: &str, port: &str, serial: &str) -> Result<String, String> {
  let mut stream = TcpStream::connect(format!("{}:{}", ip, port)).map_err(|e| format!("Error connecting to socket: {}", e))?;

  let current_time = chrono::Local::now().format("%Y%m%d%H%M%S").to_string();
  let message = format!("HELLO 1.1 {} {}", serial, current_time);

  stream.write_all(message.as_bytes()).map_err(|e| format!("Error sending data to socket: {}", e))?;

  let mut buffer = [0; 1024];
  stream.read(&mut buffer).map_err(|e| format!("Error reading response from socket: {}", e))?;

  let response = String::from_utf8_lossy(&buffer[..]);
  let command = "G00\r";
  if response.contains("HELLO") {
    stream.write_all(command.as_bytes()).map_err(|e| format!("Error sending data to socket: {}", e))?;

    let mut messages = String::new();
    loop {
      let mut buffer = [0; 1024];
      let bytes_read = stream.read(&mut buffer).map_err(|e| format!("Error reading response from socket: {}", e))?;
      if bytes_read == 0 {
        break; // No more data to read, exit the loop
      }
      let response = String::from_utf8_lossy(&buffer[..bytes_read]);
      
      if response.contains("H01"){
        messages.push_str(&response);
      }
      

      if response.contains("H02") {
        return Ok(messages.to_string()); // Return the response when "H05" is found
      }
    }

    Err(format!("No message with H05 found")) // Return an error if "H05" is not found
  } else {
    Err(format!("Error connecting to socket"))
  }
}






