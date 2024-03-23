import { addSeconds } from "date-fns"

export const getStravaActivity = async (
  object_id: number,
  accessToken: string
) => {
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${object_id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  return await res.json()
}

type RaceSegmentEffort = {
  strava_segment_id: number
  elapsed_time_in_seconds: number
  start_date: Date
  end_date: Date
  is_kom: boolean
  average_watts: number
  distance_in_meters: number
  race_segment_id: number
}
export const getRaceSegments = async (
  activity: {
    segment_efforts: {
      id: number
      elapsed_time: number
      start_date_local: string
      is_kom: boolean
      average_watts: number
      distance: number
    }[]
  },
  scheduledRace: {
    RaceSegment: {
      strava_segment_id: bigint
      id: number
    }[]
  }
): Promise<RaceSegmentEffort[]> => {
  const rse = activity.segment_efforts.map((se: any) => {
    const scheduledRaceSegment = scheduledRace.RaceSegment.find(
      (rs: any) => Number(rs.strava_segment_id) === se.segment.id
    )
    if (scheduledRaceSegment) {
      return {
        strava_segment_id: se.segment.id,
        elapsed_time_in_seconds: se.elapsed_time,
        start_date: se.start_date_local,
        end_date: addSeconds(se.start_date_local, se.elapsed_time),
        is_kom: !!se.is_kom,
        average_watts: se.average_watts,
        distance_in_meters: se.distance,
        race_segment_id: scheduledRaceSegment.id,
      }
    }
  })
  return rse.filter(Boolean) as RaceSegmentEffort[]
}
