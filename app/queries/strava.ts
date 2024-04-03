import { Jersey } from "@prisma/client"
import { addSeconds, subHours, addHours } from "date-fns"

export const getStravaActivity = async (
  object_id: number,
  accessToken: string
) => {
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${object_id}?include_all_efforts=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  // TODO: handle errors here before returning
  const jsonResp = await res.json()
  return jsonResp
}

export const findActivitiesForUser = async (
  date: Date,
  accessToken: string
) => {
  const start = subHours(date, 2).getTime() / 1000
  const end = addHours(date, 1).getTime() / 1000
  // const start =
  //   new Date(`${date.toISOString().split("T")[0]}T00:00:00Z`).getTime() / 1000
  // const end =
  //   new Date(`${date.toISOString().split("T")[0]}T23:59:59Z`).getTime() / 1000
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${start}&before=${end}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  // TODO: handle errors here before returning
  const jsonResponse = await res.json()
  return jsonResponse
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
  jersey?: Jersey
}
export const getRaceSegments = async (
  activity: {
    segment_efforts: {
      id: number
      elapsed_time: number
      start_date_local: string
      is_kom: boolean
      kom_rank?: number
      average_watts: number
      distance: number
    }[]
  },
  scheduledRace: {
    RaceSegment: {
      strava_segment_id: bigint
      id: number
      jersey: Jersey
    }[]
  }
): Promise<RaceSegmentEffort[]> => {
  const rse = activity.segment_efforts.map((se: any) => {
    const scheduledRaceSegment = scheduledRace.RaceSegment.find(
      (rs: any) => rs && Number(rs.strava_segment_id) === se.segment.id
    )
    if (scheduledRaceSegment) {
      return {
        strava_segment_id: se.segment.id,
        elapsed_time_in_seconds: se.elapsed_time,
        start_date: se.start_date_local,
        end_date: addSeconds(se.start_date_local, se.elapsed_time),
        is_kom: !!se.is_kom,
        kom_rank: se.kom_rank,
        average_watts: se.average_watts,
        distance_in_meters: se.distance,
        race_segment_id: scheduledRaceSegment.id,
        jersey: scheduledRaceSegment.jersey,
      }
    }
  })
  return rse.filter(Boolean) as RaceSegmentEffort[]
}
