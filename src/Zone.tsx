import { IZone } from "./interfaces";
import './zone.css'
import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";


export function Zone(props: { zone: IZone, isSelected: boolean, onSelect: () => void }){

    
    const spring = useSpring({
        from: { opacity: 0, transform: 'translate3d(0, -100%, 0)'},
        to: { opacity: 1, transform: 'translate3d(0, 0%, 0)'}
        
    });

    return (
        <animated.div 
        
        style={spring}
        className={`ZoneCard ${props.isSelected ? 'selectedZone' : ''}`} onClick={(e) => {
            e.preventDefault();
            props.onSelect();

        }}>
            <h5>{props.zone.name}</h5>
            
            <p>Current Temperature: {props.zone.temp_comfort_c}</p>
        </animated.div>
    )
}