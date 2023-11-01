// Prevents additional console window on Windows in release, DO NOT REMOVE!!

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use serde::Serialize;
use std::io::Read;
use std::io::Write;
use std::net::TcpStream;

use std::vec;
#[derive(Deserialize, Serialize)]
struct Zone {
    zone_id: String,
    name: String,
    week_profile_id: String,
    temp_comfort_c: String,
    temp_eco_c: String,
    override_allowed: String,
    deprecated_override_id: String,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            hello_name,
            update_zone,
            get_all_zones
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn hello_name(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn update_zone(
    ip: &str,
    port: &str,
    serial: &str,
    temperature: &str,
    zones: String,
) -> Result<bool, String> {

  let zones: Vec<Zone> = serde_json::from_str(&zones).unwrap();

  let mut stream = TcpStream::connect(format!("{}:{}", ip, port))
        .map_err(|e| format!("Error connecting to socket: {}", e))?;

    let current_time: String = chrono::Local::now().format("%Y%m%d%H%M%S").to_string();
    let message: String = format!("HELLO 1.1 {} {}", serial, current_time);

    stream
        .write_all(message.as_bytes())
        .map_err(|e| format!("Error sending data to socket: {}", e))?;

    let mut buffer = [0; 1024];
    stream
        .read(&mut buffer)
        .map_err(|e| format!("Error reading response from socket: {}", e))?;

    let response: std::borrow::Cow<'_, str> = String::from_utf8_lossy(&buffer[..]);
    
    if response.contains("HELLO") {
      for Zone in zones {
        let command = format!("U00 {} {} {} {} {} {} {}", Zone.zone_id, Zone.name, Zone.week_profile_id, temperature, temperature, Zone.override_allowed,Zone.deprecated_override_id);
        stream
        .write_all(command.as_bytes())
        .map_err(|e| format!("Error sending data to socket: {}", e))?;

        

        loop {
            let mut buffer = [0; 1024];
            let bytes_read = stream
                .read(&mut buffer)
                .map_err(|e| format!("Error reading response from socket: {}", e))?;
            if bytes_read == 0 {
                break; // No more data to read, exit the loop
            }
            let response = String::from_utf8_lossy(&buffer[..bytes_read]);

            if !response.trim().is_empty() {
              println!("{}", response);
                break; // Return the response when "H05" is found
            }
        }
         
      }

      Ok(true)
        
    }
    else {
      Err(format!("Error connecting to socket"))
    }
  
}

#[tauri::command]
fn get_all_zones(ip: &str, port: &str, serial: &str) -> Result<Vec<Zone>, String> {
    let mut stream = TcpStream::connect(format!("{}:{}", ip, port))
        .map_err(|e| format!("Error connecting to socket: {}", e))?;

    let current_time: String = chrono::Local::now().format("%Y%m%d%H%M%S").to_string();
    let message: String = format!("HELLO 1.1 {} {}", serial, current_time);

    stream
        .write_all(message.as_bytes())
        .map_err(|e| format!("Error sending data to socket: {}", e))?;

    let mut buffer = [0; 1024];
    stream
        .read(&mut buffer)
        .map_err(|e| format!("Error reading response from socket: {}", e))?;

    let response: std::borrow::Cow<'_, str> = String::from_utf8_lossy(&buffer[..]);
    let command: &str = "G00\r";
    if response.contains("HELLO") {
        stream
            .write_all(command.as_bytes())
            .map_err(|e| format!("Error sending data to socket: {}", e))?;

        let mut messages = String::new();
        loop {
            let mut buffer = [0; 1024];
            let bytes_read = stream
                .read(&mut buffer)
                .map_err(|e| format!("Error reading response from socket: {}", e))?;
            if bytes_read == 0 {
                break; // No more data to read, exit the loop
            }
            let response = String::from_utf8_lossy(&buffer[..bytes_read]);

            if response.contains("H01") {
                messages.push_str(&response);
            }

            if response.contains("H02") {
                let zones = convert_string_to_zone_array(&messages);
                return Ok(zones); // Return the response when "H05" is found
            }
        }

        Err(format!("No message with H05 found")) // Return an error if "H05" is not found
    } else {
        Err(format!("Error connecting to socket"))
    }
}

fn convert_string_to_zone_array(zones_string: &String) -> Vec<Zone> {
    let mut zones: Vec<Zone> = Vec::new();
    let lines = zones_string.split("\r");

    for line in lines {
        if line.trim().is_empty() {
            continue;
        }
        let mut zone = Zone {
            zone_id: String::new(),
            name: String::new(),
            week_profile_id: String::new(),
            temp_comfort_c: String::new(),
            temp_eco_c: String::new(),
            override_allowed: String::new(),
            deprecated_override_id: String::new(),
        };
        
        

        let fields: Vec<&str> = line.split(" ").collect();
        zone.zone_id = fields[1].to_string();
        zone.name = fields[2].to_string();
        zone.week_profile_id = fields[3].to_string();
        zone.temp_comfort_c = fields[4].to_string();
        zone.temp_eco_c = fields[5].to_string();
        zone.override_allowed = fields[6].to_string();
        zone.deprecated_override_id = fields[7].to_string();

        zones.push(zone);
    }

    
    return zones;
}
