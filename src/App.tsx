import { useEffect, useState } from 'react'
import hubinfo from '../hubinfo.json';
import { IZone } from './interfaces';
import zonesJson from '../zones.json';
import { Zone } from './Zone';
import { animated, useSpring } from '@react-spring/web'



import './App.css'
import { invoke } from '@tauri-apps/api'


const zones = zonesJson as IZone[];


function App() {

  //create a spring
  

  const [zonesToUpdate, setZonesToUpdate] = useState<IZone[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(20);
  const [departure, setDeparture] = useState<boolean>(false);
  const [updateAll, setUpdateAll] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  function handleCardSelection(zoneId: string) {
    setSelectedCards((prevSelectedCards) => {
      if (prevSelectedCards.includes(zoneId)) {
        return prevSelectedCards.filter((id) => id !== zoneId);
      } else {
        return [...prevSelectedCards, zoneId];
      }
    });
  }


  

  useEffect(() => {
    console.log(zones)
    document.body.style.maxWidth = "100%";
    document.addEventListener('keypress', (e) => {
      if(e.key === "F10") console.log("F10")
    } )
    
  }, [])


  useEffect(() => {
    //sort selected cards by zone_id
    setSelectedCards((prevSelectedCards) => {
      return prevSelectedCards.sort((a, b) => {
        const zoneA = zones.find((zone) => zone.zone_id === a);
        const zoneB = zones.find((zone) => zone.zone_id === b);
        if(zoneA && zoneB){
          return zoneA.zone_id.localeCompare(zoneB.zone_id);
        }
        else{
          return 0;
        }
      })
    })
  }, [selectedCards])

  useEffect(() => {
    //sort zones to update by zone_id
    let tempzones = zonesToUpdate;
    //get the substring that is a number from the zone name and sort by that from smallest to biggest
    tempzones = tempzones.sort((a, b) => {
      const zoneA = a.name.match(/\d+/g);
      const zoneB = b.name.match(/\d+/g);
      if(zoneA && zoneB){
        return Number(zoneA[0]) - Number(zoneB[0]);
      }
      else{
        return 0;
      }
    })

    setZonesToUpdate(tempzones);
    
  }, [zonesToUpdate])

 

  async function getallZones(zones: IZone[]){
    const res: string = await invoke("get_all_zones", hubinfo);
    
    const lines = res.split('\r');
    lines.forEach((line) => {
      const zone = line.split(' ');
      const zone_id = zone[1];
      const temperature = zone[4];
      const zoneToUpdate = zones.find((zone) => zone.zone_id === zone_id);
      if(zoneToUpdate){
        zoneToUpdate.temp_comfort_c = temperature;
        zoneToUpdate.temp_eco_c = temperature;
      }
      
      //replace the old zone with the new one
      const index = zones.findIndex((zone) => zone.zone_id === zone_id);
      if(index !== -1){
        zones[index] = zoneToUpdate as IZone;
        
      }
      setLoading(false);
      setZonesToUpdate(zones);
      
      
      
    });
  }

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>){
    const value:string = e.target.value as string;
    if(value.startsWith("Rom #") || value.startsWith("Rum #") || value.startsWith("Room #")){
      
      GetZonesToUpdate(value);
      
    }
    else{
      //empty all arrays
      setZonesToUpdate([]);
      setSelectedCards([]);

    }
  }

  /**
   * Get the zones to update based on the input value.
   * @param value - The input value.
   */
  function GetZonesToUpdate(value: string){
    setLoading(true);
    const lines = value.split('\n');
    let roomNumbers = lines.slice(1).map((line) => line.split('\t')[0].trim());
    roomNumbers = roomNumbers.filter((roomNumber) => roomNumber.length === 3 && !isNaN(Number(roomNumber)));
    const tempzones: IZone[] = [];
    for (let index = 0; index < roomNumbers.length; index++) {
      const room = roomNumbers[index];
      zones.forEach((zone) => {
        if(zone.name.includes(room)){
          tempzones.push(zone);
        }
      });
    }
    getallZones(tempzones);
    
  }

  function UpdatesStringBuilder(zoneid: string, temperature: string): string{
    const zone = zones.find((zone) => zone.zone_id === zoneid);
    const updateString = `U00 ${zone?.zone_id} ${zone?.name} ${zone?.week_profile_id} ${temperature} ${temperature} ${zone?.override_allowed} ${zone?.deprecated_override_id} \r`
    return updateString;
  }

  function UpdateZone(updateString: string){
    invoke("update_zone", {
      ip: hubinfo.ip,
      port: hubinfo.port,
      serial: hubinfo.serial,
      updateString: updateString
    }).then((res) => {
      console.log("Success: ", res)
    }).catch((err) => {
      console.log(err)
    } );


  }

  function Update(){
    if(updateAll){
      if(!departure){
      zonesToUpdate.forEach((zone) => {
        const updateString = UpdatesStringBuilder(zone.zone_id, temperature.toString());
        UpdateZone(updateString);
      });
    }
    else{
      zonesToUpdate.forEach((zone) => {
        const updateString = UpdatesStringBuilder(zone.zone_id, "10");
        UpdateZone(updateString);
      });
    }
    }
    else{
      if(!departure){
      selectedCards.forEach((zoneid) => {
        const updateString = UpdatesStringBuilder(zoneid, temperature.toString());
        UpdateZone(updateString);
      });
    }
    else{
      selectedCards.forEach((zoneid) => {
        const updateString = UpdatesStringBuilder(zoneid, "10");
        UpdateZone(updateString);
      });
    }
    }

    getallZones(zonesToUpdate);
  }

  


  return (
    <>
      <div className="controlsdiv">
        
        {loading ? <p>Loading...</p> : null}
        <button onClick={() => Update()}>Update</button>
        
      <div className="temperature">
        <label htmlFor="Temperature">Temperature</label>
        <input type='number' placeholder='Temperature: ' style={{color:'black'}}value={temperature} onChange={(e) => {
          setTemperature(Number(e.target.value))
          console.log(e.target.value)
          }} />
        </div>
      
      <div className="options">
        <label htmlFor="Departure">Departure</label>
        <input type='checkbox' id='DepartureTrue' checked={departure} onChange={() => setDeparture(!departure)} />
        <label htmlFor="UpdateAll">Update All</label>
        <input type='checkbox' id='UpdateAll' checked={updateAll} onChange={() => setUpdateAll(!updateAll)} />
        </div>
      </div>
      <div id="roominputdiv">
        <label htmlFor="roominput">Room Input</label>
        <textarea id="output" placeholder="Input rooms here: "onChange={(e) => onInput(e)}/>
        
       
      </div>

      <div className="gridcontainer">
        <div className={`zoneContainer ${zonesToUpdate.length == 0 ? 'hidden' : ''}`}>
          {zonesToUpdate.map((zone) => <Zone key={zone.zone_id} zone={zone} isSelected={selectedCards.includes(zone.zone_id)} onSelect={() => {
            handleCardSelection(zone.zone_id) 
            }}/>)}
        </div>
      </div>
    </>
  )
}

export default App;
