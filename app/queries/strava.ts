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

  const jsonResp = await res.json()
  if (jsonResp.errors) {
    console.error("Error fetching activities", jsonResp.errors)
    // TODO: Find out which user, log it and delete/mark them from db
    return []
  }
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

  const jsonResp = await res.json()
  if (jsonResp.errors) {
    console.error("Error fetching activities", jsonResp.errors)
    // TODO: Find out which user, log it and delete/mark them from db
    return []
  }
  return jsonResp
}

type RaceSegmentEffort = {
  strava_segment_id: number
  elapsed_time_in_seconds: number
  start_date: Date
  end_date: Date
  is_kom: boolean
  kom_rank?: number
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
  },
  user: { eligible_for_old: boolean; sex: "M" | "F" }
): Promise<RaceSegmentEffort[]> => {
  const res = []
  for (const rs of scheduledRace.RaceSegment) {
    const scheduledRaceSegment = activity.segment_efforts.find(
      (se: any) => se.segment.id === Number(rs.strava_segment_id)
    )
    console.log("checking rs", rs, "for user", user)
    if (scheduledRaceSegment) {
      if (
        (user.eligible_for_old && rs.jersey === "OLD") ||
        (user.sex === "F" && rs.jersey === "PINK") ||
        rs.jersey === "YELLOW" ||
        rs.jersey === "GREEN" ||
        rs.jersey === "POLKA"
      ) {
        console.log("found segment", scheduledRaceSegment)
        res.push({
          strava_segment_id: Number(rs.strava_segment_id),
          elapsed_time_in_seconds: scheduledRaceSegment.elapsed_time,
          start_date: new Date(scheduledRaceSegment.start_date_local),
          end_date: addSeconds(
            scheduledRaceSegment.start_date_local,
            scheduledRaceSegment.elapsed_time
          ),
          is_kom: !!scheduledRaceSegment.is_kom,
          kom_rank: scheduledRaceSegment.kom_rank,
          average_watts: scheduledRaceSegment.average_watts,
          distance_in_meters: scheduledRaceSegment.distance,
          race_segment_id: rs.id,
          jersey: rs.jersey,
        })
      }
    }
  }
  return res
}
