export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          condition_type: string | null
          condition_value: number | null
          description: string | null
          icon: string | null
          id: string
          slug: string
          title: string
        }
        Insert: {
          condition_type?: string | null
          condition_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          slug: string
          title: string
        }
        Update: {
          condition_type?: string | null
          condition_value?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      auth_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          provider_data: Json | null
          provider_user_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          provider_data?: Json | null
          provider_user_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          provider_data?: Json | null
          provider_user_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          description: string
          dev_reply: string | null
          dev_reply_at: string | null
          id: string
          screenshot_storage_path: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          dev_reply?: string | null
          dev_reply_at?: string | null
          id?: string
          screenshot_storage_path?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          dev_reply?: string | null
          dev_reply_at?: string | null
          id?: string
          screenshot_storage_path?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link_id: string | null
          link_type: string | null
          read_at: string | null
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_data?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_id?: string | null
          link_type?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_data?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_id?: string | null
          link_type?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_accounts: {
        Row: {
          id: string
          linked_at: string | null
          provider: string
          provider_avatar_url: string | null
          provider_first_name: string | null
          provider_last_name: string | null
          provider_user_id: string
          provider_username: string | null
          user_id: string
        }
        Insert: {
          id?: string
          linked_at?: string | null
          provider: string
          provider_avatar_url?: string | null
          provider_first_name?: string | null
          provider_last_name?: string | null
          provider_user_id: string
          provider_username?: string | null
          user_id: string
        }
        Update: {
          id?: string
          linked_at?: string | null
          provider?: string
          provider_avatar_url?: string | null
          provider_first_name?: string | null
          provider_last_name?: string | null
          provider_user_id?: string
          provider_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_at: string | null
          player_id: string
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          player_id: string
          product_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          player_id?: string
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          player_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          player_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          reactions_count: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          reactions_count?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          reactions_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          auto_expires_at: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          media_urls: string[] | null
          pinned_at: string | null
          poll_multiple_choice: boolean | null
          poll_options: Json | null
          poll_question: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          reactions_count: number | null
          title: string | null
          tournament_id: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          auto_expires_at?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_urls?: string[] | null
          pinned_at?: string | null
          poll_multiple_choice?: boolean | null
          poll_options?: Json | null
          poll_question?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          reactions_count?: number | null
          title?: string | null
          tournament_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          auto_expires_at?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_urls?: string[] | null
          pinned_at?: string | null
          poll_multiple_choice?: boolean | null
          poll_options?: Json | null
          poll_question?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          reactions_count?: number | null
          title?: string | null
          tournament_id?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          price: number
          stock: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          price: number
          stock?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          price?: number
          stock?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          city: string
          created_at: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          joined_at: string | null
          matches_played: number | null
          matches_won: number | null
          onboarding: Json
          rating_doubles: number | null
          rating_overall: number | null
          rating_singles: number | null
          role: Database["public"]["Enums"]["user_role"]
          tournaments_played: number | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          city?: string
          created_at?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          joined_at?: string | null
          matches_played?: number | null
          matches_won?: number | null
          onboarding?: Json
          rating_doubles?: number | null
          rating_overall?: number | null
          rating_singles?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          tournaments_played?: number | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          city?: string
          created_at?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          joined_at?: string | null
          matches_played?: number | null
          matches_won?: number | null
          onboarding?: Json
          rating_doubles?: number | null
          rating_overall?: number | null
          rating_singles?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          tournaments_played?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_info: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_info?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_info?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      repair_batches: {
        Row: {
          actual_return_date: string | null
          actual_send_date: string | null
          created_at: string | null
          created_by: string | null
          expected_return_date: string | null
          id: string
          notes: string | null
          planned_send_date: string | null
          status: Database["public"]["Enums"]["batch_status"]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          actual_send_date?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          planned_send_date?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          actual_send_date?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          planned_send_date?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_rackets: {
        Row: {
          batch_id: string
          cost: number | null
          created_at: string | null
          id: string
          is_paid: boolean | null
          notes: string | null
          owner_id: string
          paid_at: string | null
          racket_model: string | null
          repair_type: Database["public"]["Enums"]["repair_type"]
          status: Database["public"]["Enums"]["racket_status"]
          string_type: string | null
          tension: string | null
          updated_at: string | null
        }
        Insert: {
          batch_id: string
          cost?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          owner_id: string
          paid_at?: string | null
          racket_model?: string | null
          repair_type: Database["public"]["Enums"]["repair_type"]
          status?: Database["public"]["Enums"]["racket_status"]
          string_type?: string | null
          tension?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_id?: string
          cost?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          owner_id?: string
          paid_at?: string | null
          racket_model?: string | null
          repair_type?: Database["public"]["Enums"]["repair_type"]
          status?: Database["public"]["Enums"]["racket_status"]
          string_type?: string | null
          tension?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_rackets_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "repair_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_rackets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_categories: {
        Row: {
          age_group: string | null
          bracket_format: string | null
          bracket_generated: boolean | null
          bracket_settings: Json | null
          bracket_status: string | null
          category: Database["public"]["Enums"]["badminton_category"]
          id: string
          max_pairs: number | null
          participants_count: number | null
          rating_group: string | null
          tournament_id: string
        }
        Insert: {
          age_group?: string | null
          bracket_format?: string | null
          bracket_generated?: boolean | null
          bracket_settings?: Json | null
          bracket_status?: string | null
          category: Database["public"]["Enums"]["badminton_category"]
          id?: string
          max_pairs?: number | null
          participants_count?: number | null
          rating_group?: string | null
          tournament_id: string
        }
        Update: {
          age_group?: string | null
          bracket_format?: string | null
          bracket_generated?: boolean | null
          bracket_settings?: Json | null
          bracket_status?: string | null
          category?: Database["public"]["Enums"]["badminton_category"]
          id?: string
          max_pairs?: number | null
          participants_count?: number | null
          rating_group?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_categories_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          category_id: string | null
          court: string | null
          created_at: string | null
          id: string
          loser_match_id: string | null
          match_type: string | null
          next_match_id: string | null
          participant1_id: string | null
          participant2_id: string | null
          placeholder_p1: string | null
          placeholder_p2: string | null
          position: number
          round: number
          score: Json | null
          status: string | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          category_id?: string | null
          court?: string | null
          created_at?: string | null
          id?: string
          loser_match_id?: string | null
          match_type?: string | null
          next_match_id?: string | null
          participant1_id?: string | null
          participant2_id?: string | null
          placeholder_p1?: string | null
          placeholder_p2?: string | null
          position: number
          round: number
          score?: Json | null
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          category_id?: string | null
          court?: string | null
          created_at?: string | null
          id?: string
          loser_match_id?: string | null
          match_type?: string | null
          next_match_id?: string | null
          participant1_id?: string | null
          participant2_id?: string | null
          placeholder_p1?: string | null
          placeholder_p2?: string | null
          position?: number
          round?: number
          score?: Json | null
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_loser_match_id_fkey"
            columns: ["loser_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          category_id: string
          created_at: string | null
          fee_paid: boolean | null
          fee_paid_at: string | null
          guest1_id: string | null
          guest2_id: string | null
          id: string
          pair_status: Database["public"]["Enums"]["pair_status"] | null
          player1_id: string | null
          player2_id: string | null
          registered_by: string | null
          seed: number | null
          status: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          guest1_id?: string | null
          guest2_id?: string | null
          id?: string
          pair_status?: Database["public"]["Enums"]["pair_status"] | null
          player1_id?: string | null
          player2_id?: string | null
          registered_by?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          guest1_id?: string | null
          guest2_id?: string | null
          id?: string
          pair_status?: Database["public"]["Enums"]["pair_status"] | null
          player1_id?: string | null
          player2_id?: string | null
          registered_by?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tournament_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_guest1_id_fkey"
            columns: ["guest1_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_guest2_id_fkey"
            columns: ["guest2_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          awards: string | null
          contact_info: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          entry_fee_amount: number | null
          entry_fee_note: string | null
          has_entry_fee: boolean | null
          id: string
          location: string
          max_participants: number | null
          organizer: string | null
          participants_count: number | null
          pdf_storage_path: string | null
          pdf_url: string | null
          registration_deadline: string | null
          registration_time: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          tournament_type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string | null
          venue: string | null
          venue_address: string | null
        }
        Insert: {
          awards?: string | null
          contact_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_fee_amount?: number | null
          entry_fee_note?: string | null
          has_entry_fee?: boolean | null
          id?: string
          location: string
          max_participants?: number | null
          organizer?: string | null
          participants_count?: number | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          registration_deadline?: string | null
          registration_time?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          tournament_type: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Update: {
          awards?: string | null
          contact_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_fee_amount?: number | null
          entry_fee_note?: string | null
          has_entry_fee?: boolean | null
          id?: string
          location?: string
          max_participants?: number | null
          organizer?: string | null
          participants_count?: number | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          registration_deadline?: string | null
          registration_time?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          tournament_type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attendance: {
        Row: {
          id: string
          player_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          training_id: string
        }
        Insert: {
          id?: string
          player_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          training_id: string
        }
        Update: {
          id?: string
          player_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          training_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          training_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_comments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedule_template: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          training_group: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          training_group: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          training_group?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          auto_post_id: string | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          start_time: string
          status: Database["public"]["Enums"]["training_status"]
          status_note: string | null
          substitute_name: string | null
          training_group: string
          updated_at: string | null
        }
        Insert: {
          auto_post_id?: string | null
          created_at?: string | null
          date: string
          end_time?: string
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["training_status"]
          status_note?: string | null
          substitute_name?: string | null
          training_group?: string
          updated_at?: string | null
        }
        Update: {
          auto_post_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["training_status"]
          status_note?: string | null
          substitute_name?: string | null
          training_group?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trainings_auto_post"
            columns: ["auto_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_invites: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          player_id: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          player_id: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          player_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invites_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          amount_due: number | null
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_at: string | null
          player_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["trip_participant_status"]
          trip_id: string
        }
        Insert: {
          amount_due?: number | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          player_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["trip_participant_status"]
          trip_id: string
        }
        Update: {
          amount_due?: number | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          player_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["trip_participant_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accommodation_info: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          destination: string
          end_date: string | null
          estimated_cost: number | null
          id: string
          start_date: string
          title: string
          tournament_id: string | null
          transport_info: string | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string | null
          visibility: Database["public"]["Enums"]["trip_visibility"]
        }
        Insert: {
          accommodation_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination: string
          end_date?: string | null
          estimated_cost?: number | null
          id?: string
          start_date: string
          title: string
          tournament_id?: string | null
          transport_info?: string | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["trip_visibility"]
        }
        Update: {
          accommodation_info?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          destination?: string
          end_date?: string | null
          estimated_cost?: number | null
          id?: string
          start_date?: string
          title?: string
          tournament_id?: string | null
          transport_info?: string | null
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["trip_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tournament_pdfs: { Args: never; Returns: undefined }
      cleanup_finished_tournaments: { Args: never; Returns: undefined }
      cleanup_old_posts: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      decrement_comments_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      decrement_reactions_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      generate_trainings: {
        Args: { months_ahead?: number; start_date: string }
        Returns: number
      }
      increment_comments_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_reactions_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      is_coach: { Args: never; Returns: boolean }
      is_dev: { Args: never; Returns: boolean }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
      search_players_for_partner:
        | {
            Args: {
              exclude_user_id: string
              result_limit?: number
              search_query: string
            }
            Returns: {
              avatar_url: string
              full_name: string
              id: string
              role: Database["public"]["Enums"]["user_role"]
            }[]
          }
        | {
            Args: {
              exclude_user_id: string
              filter_gender?: string
              result_limit?: number
              search_query: string
            }
            Returns: {
              avatar_url: string
              full_name: string
              gender: Database["public"]["Enums"]["gender_type"]
              id: string
              role: Database["public"]["Enums"]["user_role"]
            }[]
          }
    }
    Enums: {
      attendance_status: "going" | "not_going" | "no_response"
      badminton_category: "MS" | "WS" | "MD" | "WD" | "XD"
      batch_status: "collecting" | "sent" | "in_repair" | "completed"
      feedback_status: "new" | "seen" | "in_progress" | "done" | "rejected"
      feedback_type: "bug" | "idea" | "other"
      gender_type: "male" | "female"
      match_status: "scheduled" | "in_progress" | "completed" | "walkover"
      notification_type:
        | "new_post"
        | "comment_reply"
        | "pair_invite"
        | "pair_response"
        | "bracket_published"
        | "match_upcoming"
        | "racket_ready"
        | "training_change"
        | "trip_reminder"
        | "registration_deadline"
        | "payment_reminder"
        | "achievement_earned"
      order_status: "pending" | "confirmed" | "completed" | "cancelled"
      pair_status: "pending" | "confirmed" | "declined"
      participant_status: "registered" | "confirmed" | "withdrawn"
      post_type: "text" | "media" | "poll" | "auto"
      racket_status:
        | "collecting"
        | "sent_to_rostov"
        | "in_repair"
        | "ready"
        | "returned"
      repair_type: "restring" | "repair"
      tournament_status:
        | "draft"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "completed"
      tournament_type: "home" | "away"
      training_status:
        | "normal"
        | "no_coach_open"
        | "substitute"
        | "cancelled"
        | "holiday"
        | "tournament_trip"
      trip_participant_status: "going" | "not_going" | "maybe" | "no_response"
      trip_type: "tournament" | "training_camp" | "recreation"
      trip_visibility: "all" | "invited_only"
      user_role: "coach" | "player" | "development"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["going", "not_going", "no_response"],
      badminton_category: ["MS", "WS", "MD", "WD", "XD"],
      batch_status: ["collecting", "sent", "in_repair", "completed"],
      feedback_status: ["new", "seen", "in_progress", "done", "rejected"],
      feedback_type: ["bug", "idea", "other"],
      gender_type: ["male", "female"],
      match_status: ["scheduled", "in_progress", "completed", "walkover"],
      notification_type: [
        "new_post",
        "comment_reply",
        "pair_invite",
        "pair_response",
        "bracket_published",
        "match_upcoming",
        "racket_ready",
        "training_change",
        "trip_reminder",
        "registration_deadline",
        "payment_reminder",
        "achievement_earned",
      ],
      order_status: ["pending", "confirmed", "completed", "cancelled"],
      pair_status: ["pending", "confirmed", "declined"],
      participant_status: ["registered", "confirmed", "withdrawn"],
      post_type: ["text", "media", "poll", "auto"],
      racket_status: [
        "collecting",
        "sent_to_rostov",
        "in_repair",
        "ready",
        "returned",
      ],
      repair_type: ["restring", "repair"],
      tournament_status: [
        "draft",
        "registration_open",
        "registration_closed",
        "in_progress",
        "completed",
      ],
      tournament_type: ["home", "away"],
      training_status: [
        "normal",
        "no_coach_open",
        "substitute",
        "cancelled",
        "holiday",
        "tournament_trip",
      ],
      trip_participant_status: ["going", "not_going", "maybe", "no_response"],
      trip_type: ["tournament", "training_camp", "recreation"],
      trip_visibility: ["all", "invited_only"],
      user_role: ["coach", "player", "development"],
    },
  },
} as const
