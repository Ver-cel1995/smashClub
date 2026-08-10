import type { Database } from './database'

// Удобные алиасы для таблиц
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Training = Database['public']['Tables']['trainings']['Row']
export type TrainingAttendance = Database['public']['Tables']['training_attendance']['Row']

export type Post = Database['public']['Tables']['posts']['Row']
export type PostReaction = Database['public']['Tables']['post_reactions']['Row']
export type PostComment = Database['public']['Tables']['post_comments']['Row']

export type Tournament = Database['public']['Tables']['tournaments']['Row']
export type TournamentCategory = Database['public']['Tables']['tournament_categories']['Row']
export type TournamentParticipant = Database['public']['Tables']['tournament_participants']['Row']
export type TournamentMatch = Database['public']['Tables']['tournament_matches']['Row']

export type Guest = Database['public']['Tables']['guests']['Row']

export type Trip = Database['public']['Tables']['trips']['Row']
export type TripParticipant = Database['public']['Tables']['trip_participants']['Row']
export type RepairRacket = Database['public']['Tables']['repair_rackets']['Row']
export type RepairBatch = Database['public']['Tables']['repair_batches']['Row']
export type TrainingScheduleTemplate = Database['public']['Tables']['training_schedule_template']['Row']

export type TripParticipantStatus = Database['public']['Enums']['trip_participant_status']
export type RacketStatus = Database['public']['Enums']['racket_status']
export type RepairType = Database['public']['Enums']['repair_type']

// Enums
export type UserRole = Database['public']['Enums']['user_role']
export type TrainingStatus = Database['public']['Enums']['training_status']
export type AttendanceStatus = Database['public']['Enums']['attendance_status']
export type BadmintonCategory = Database['public']['Enums']['badminton_category']

// Расширенные типы с джойнами (пример)
export type PostWithAuthor = Post & {
    author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

// Расширенные типы для home
export type TripWithParticipants = Trip & {
    participants: (TripParticipant & {
        profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
    })[]
    my_status: TripParticipantStatus | null
}

export type TrainingWithAttendance = Training & {
    attendance: (TrainingAttendance & {
        profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
    })[]
    my_status: AttendanceStatus | null
    going_count: number
    not_going_count: number
}

export type RepairSummaryPlayer = {
    rackets: (RepairRacket & {
        batch: Pick<
            RepairBatch,
            'id' | 'actual_send_date' | 'expected_return_date' | 'planned_send_date'
        > | null
    })[]
    total_cost: number
}

export type RepairSummaryCoach = {
    players_count: number
    rackets_count: number
    total_cost: number
    unpaid_cost: number
    players: {
        profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
        rackets: RepairRacket[]
        total_cost: number
        unpaid_cost: number
    }[]
}