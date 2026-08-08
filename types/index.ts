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

// Enums
export type UserRole = Database['public']['Enums']['user_role']
export type TrainingStatus = Database['public']['Enums']['training_status']
export type AttendanceStatus = Database['public']['Enums']['attendance_status']
export type BadmintonCategory = Database['public']['Enums']['badminton_category']

// Расширенные типы с джойнами (пример)
export type PostWithAuthor = Post & {
    author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

export type TrainingWithAttendance = Training & {
    attendance: (TrainingAttendance & {
        player: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
    })[]
}