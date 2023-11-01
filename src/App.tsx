import './App.css'
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api'
import { IZone, IRoom } from './interfaces'
import { Zone } from './Zone'
import hubinfo from '../hubinfo.json'

export default function App() {

  const [zones, setZones] = useState([] as IZone[])
  const [selectedRooms, setSelectedRooms] = useState([] as IRoom[])
  const [rooms, setRooms] = useState([] as IRoom[])
  const [allRooms, setAllRooms] = useState(true)
  const [temperature, setTemperature] = useState(20)

  useEffect(() => {
    if(allRooms){
              setSelectedRooms([])
            }
          }, [allRooms])

          useEffect(() => {
            
          }, [selectedRooms])

          useEffect(() => {
            const oldrooms = [...rooms]
            const newrooms: IRoom[] = []

            for (let index = 0; index < oldrooms.length; index++) {
              const room = oldrooms[index];
              if(room.varmekabel){
                room.varmekabel = zones.find((zone) => zone.name.toLowerCase().includes("varmekabel") && zone.name.includes(room.room)) as IZone
              }
              if(room.varmeovn){
                room.varmeovn = zones.find((zone) => zone.name.toLowerCase().includes("varmeovn") && zone.name.includes(room.room)) as IZone
              } 
              newrooms.push(room)
            }

            setRooms(newrooms)
          }, [zones])

  function HandleRoomSelect(room: IRoom){
    if(selectedRooms.includes(room)){
      setSelectedRooms(selectedRooms.filter((r) => r !== room))
    }else{
      setSelectedRooms([...selectedRooms, room])
    }


  }

  function AdjustArrivals(){
    const zonestoupdate: IZone[] = []
    if(allRooms){
    for (let index = 0; index < rooms.length; index++) {
      const room = rooms[index];
      if(room.varmekabel){
        zonestoupdate.push(room.varmekabel)
      }
      if(room.varmeovn){
        zonestoupdate.push(room.varmeovn)
      }
    }
  }
  else if(!allRooms && selectedRooms.length > 0){
    for (let index = 0; index < selectedRooms.length; index++) {
      const room = selectedRooms[index];
      if(room.varmekabel){
        zonestoupdate.push(room.varmekabel)
      }
      if(room.varmeovn){
        zonestoupdate.push(room.varmeovn)
      }
    }
  }

    invoke('update_zone', {
      ip: hubinfo.ip,
      port: hubinfo.port,
      serial: hubinfo.serial,
      zones: JSON.stringify(zonestoupdate),
      temperature: temperature.toString()
    })
    .then((result) => {
      console.log(result)
      invoke('get_all_zones', hubinfo)
    .then((result) => {
      setZones(result as IZone[])
      
    })
    .catch((err) => {
      console.log(err)
    })
    })
    .catch((err) => {
      console.log(err)
    })
  }

  function AdjustDepartures(){
    const zonestoupdate: IZone[] = []
    if(allRooms){
    for (let index = 0; index < rooms.length; index++) {
      const room = rooms[index];
      if(room.varmekabel){
        zonestoupdate.push(room.varmekabel)
      }
      if(room.varmeovn){
        zonestoupdate.push(room.varmeovn)
      }
    }
  }
  else if(!allRooms && selectedRooms.length > 0){
    for (let index = 0; index < selectedRooms.length; index++) {
      const room = selectedRooms[index];
      if(room.varmekabel){
        zonestoupdate.push(room.varmekabel)
      }
      if(room.varmeovn){
        zonestoupdate.push(room.varmeovn)
      }
    }
  }

    invoke('update_zone', {
      ip: hubinfo.ip,
      port: hubinfo.port,
      serial: hubinfo.serial,
      zones: JSON.stringify(zonestoupdate),
      temperature: "10"
    })
    .then((result) => {
      
      invoke('get_all_zones', hubinfo)
    .then((result) => {
      setZones(result as IZone[])
      
    })
    .catch((err) => {
      console.log(err)
    })
    })
    .catch((err) => {
      console.log(err)
    })
  }

  useEffect(() => {
    invoke('get_all_zones', hubinfo)
    .then((result) => {
      setZones(result as IZone[])
    })
    .catch((err) => {
      console.log(err)
    })

    
  }, [])

  function CollectRooms(e: React.ChangeEvent<HTMLTextAreaElement>){
    if(!e.target.value.startsWith('Rom #') && !e.target.value.startsWith('Rum #')){
      setRooms([])
      console.log('Not a room log')
      return;
    }

    const InputText = e.target.value

    let lines = InputText.split('\n')
    if (lines.length <= 1) return

    lines = lines.slice(1);
    
    const temprooms: IRoom[] = []

    lines.forEach(line => {
      const parts = line.split('\t');
      const roomnumber = parts[0].trim();
      //check if the first element in parts is a 3 digit number
      if(roomnumber.match(/\d{3}/) && zones.find((zone) => zone.name.includes(roomnumber))){
        const room: IRoom = {
          room: roomnumber,
          varmekabel: zones.find((zone) => zone.name.toLowerCase().includes("varmekabel") && zone.name.includes(roomnumber)) as IZone,
          varmeovn: zones.find((zone) => zone.name.toLowerCase().includes("varmeovn") && zone.name.includes(roomnumber)) as IZone
        }
        console.log(room)

        if(!rooms.includes(room)){
          console.log(`Room ${room.room} added`)
          temprooms.push(room)
        }

        
      }
    });

    setRooms(temprooms)

    
  }

  return (
    <div className="container">
      <div className='control-panel'>
      <button className='actionbutton' onClick={() => AdjustArrivals()}>Arrivals</button>
      <button className='actionbutton' onClick={() => AdjustDepartures()}>Departures</button>

      <div className='temperatureContainer'>
        <label>Temperature</label>
        <input className='temperatureInput' type='number' value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} placeholder='Temperature' />
        </div>

        <div className='allroomscontainer'>
          <label>All Rooms</label>
          <input checked={allRooms} onChange={() => {
            setAllRooms(!allRooms)
            
            }} type='checkbox' />
        </div>
      </div>
      <div className="bottomarea">
        <textarea className='roomInput' placeholder='Log' onChange={(e) => {
          
          CollectRooms(e)
          }} />
          <div className="gridgroup">
            <h1 id='roomsheader'>Rooms</h1>
                    <div className='zoneGrid'>
            
            {rooms.map((room) => {
              return (
                <Zone
                  key={room.room}
                  varmekabel={room.varmekabel}
                  varmeovn={room.varmeovn}
                  room={room.room}
                  isSelected={selectedRooms.includes(room)}
                  onSelect={() => {
                    if(allRooms) return;
                    HandleRoomSelect(room)
                  }}
                />
              );
            })}
                    </div>
          </div>
      </div>
    </div>
  )
}