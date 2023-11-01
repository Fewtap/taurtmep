export interface IZone {
    zone_id: string
    name: string
    week_profile_id: string
    temp_comfort_c: string
    temp_eco_c: string
    override_allowed: string
    deprecated_override_id: string
  }

  export interface IRoom{
    room: string
    varmekabel: IZone
    varmeovn: IZone
  }