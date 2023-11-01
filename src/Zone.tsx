import { IZone } from "./interfaces";
import './zone.css'
import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";


export function Zone(props: { room: string,varmekabel: IZone, varmeovn: IZone ,isSelected: boolean, onSelect: () => void }){

    
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
            <h5>Rom: {props.room}</h5>
            
            <p>Varmekabel: {props.varmekabel.temp_comfort_c.toString()}</p>
            <p>Varmeovn: {props.varmeovn.temp_comfort_c.toString()}</p>
        </animated.div>
    )
}