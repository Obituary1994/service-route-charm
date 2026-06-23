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
      agendamentos: {
        Row: {
          agente_id: string | null
          created_at: string
          data_hora: string
          duracao_minutos: number
          id: string
          notificado: boolean
          observacoes: string | null
          os_id: string | null
          paciente_id: string | null
          recorrencia_regra: Json | null
          recorrente: boolean
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          agente_id?: string | null
          created_at?: string
          data_hora: string
          duracao_minutos?: number
          id?: string
          notificado?: boolean
          observacoes?: string | null
          os_id?: string | null
          paciente_id?: string | null
          recorrencia_regra?: Json | null
          recorrente?: boolean
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          agente_id?: string | null
          created_at?: string
          data_hora?: string
          duracao_minutos?: number
          id?: string
          notificado?: boolean
          observacoes?: string | null
          os_id?: string | null
          paciente_id?: string | null
          recorrencia_regra?: Json | null
          recorrente?: boolean
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          assinado_em: string
          assinante_documento: string | null
          assinante_nome: string
          assinatura_data_url: string
          ficha_id: string | null
          id: string
          os_id: string | null
        }
        Insert: {
          assinado_em?: string
          assinante_documento?: string | null
          assinante_nome: string
          assinatura_data_url: string
          ficha_id?: string | null
          id?: string
          os_id?: string | null
        }
        Update: {
          assinado_em?: string
          assinante_documento?: string | null
          assinante_nome?: string
          assinatura_data_url?: string
          ficha_id?: string | null
          id?: string
          os_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_visita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      faltas_justificativas: {
        Row: {
          agente_id: string
          anexo_url: string | null
          created_at: string
          data_falta: string
          id: string
          motivo: string
          observacao_revisor: string | null
          revisado_em: string | null
          revisado_por: string | null
          status: Database["public"]["Enums"]["falta_status"]
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          agente_id: string
          anexo_url?: string | null
          created_at?: string
          data_falta: string
          id?: string
          motivo: string
          observacao_revisor?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["falta_status"]
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          agente_id?: string
          anexo_url?: string | null
          created_at?: string
          data_falta?: string
          id?: string
          motivo?: string
          observacao_revisor?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["falta_status"]
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faltas_justificativas_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_visita: {
        Row: {
          agente_id: string
          altura: number | null
          created_at: string
          dados_extras: Json | null
          data_visita: string | null
          encaminhamentos: string | null
          enviada_em: string | null
          glicemia: number | null
          hora_visita: string | null
          id: string
          motivo_visita: string | null
          observacoes: string | null
          os_id: string | null
          paciente_id: string | null
          peso: number | null
          pressao_arterial: string | null
          status: Database["public"]["Enums"]["ficha_status"]
          temperatura: number | null
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          agente_id: string
          altura?: number | null
          created_at?: string
          dados_extras?: Json | null
          data_visita?: string | null
          encaminhamentos?: string | null
          enviada_em?: string | null
          glicemia?: number | null
          hora_visita?: string | null
          id?: string
          motivo_visita?: string | null
          observacoes?: string | null
          os_id?: string | null
          paciente_id?: string | null
          peso?: number | null
          pressao_arterial?: string | null
          status?: Database["public"]["Enums"]["ficha_status"]
          temperatura?: number | null
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          agente_id?: string
          altura?: number | null
          created_at?: string
          dados_extras?: Json | null
          data_visita?: string | null
          encaminhamentos?: string | null
          enviada_em?: string | null
          glicemia?: number | null
          hora_visita?: string | null
          id?: string
          motivo_visita?: string | null
          observacoes?: string | null
          os_id?: string | null
          paciente_id?: string | null
          peso?: number | null
          pressao_arterial?: string | null
          status?: Database["public"]["Enums"]["ficha_status"]
          temperatura?: number | null
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_visita_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_visita_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_visita_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          agente_id: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          descricao: string | null
          endereco_visita: string | null
          id: string
          numero: number
          paciente_id: string | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["os_prioridade"]
          status: Database["public"]["Enums"]["os_status"]
          titulo: string
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          agente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          endereco_visita?: string | null
          id?: string
          numero?: number
          paciente_id?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["os_prioridade"]
          status?: Database["public"]["Enums"]["os_status"]
          titulo: string
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          agente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          endereco_visita?: string | null
          id?: string
          numero?: number
          paciente_id?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["os_prioridade"]
          status?: Database["public"]["Enums"]["os_status"]
          titulo?: string
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          bairro: string | null
          cns: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          endereco: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          telefone: string | null
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cns?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          telefone?: string | null
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cns?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          telefone?: string | null
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          nome_completo: string
          telefone: string | null
          ubs_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          matricula?: string | null
          nome_completo: string
          telefone?: string | null
          ubs_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          nome_completo?: string
          telefone?: string | null
          ubs_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          agente_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          observacao: string | null
          registrado_em: string
          tipo: Database["public"]["Enums"]["ponto_tipo"]
          ubs_id: string | null
        }
        Insert: {
          agente_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          registrado_em?: string
          tipo: Database["public"]["Enums"]["ponto_tipo"]
          ubs_id?: string | null
        }
        Update: {
          agente_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          registrado_em?: string
          tipo?: Database["public"]["Enums"]["ponto_tipo"]
          ubs_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_ubs_id_fkey"
            columns: ["ubs_id"]
            isOneToOne: false
            referencedRelation: "ubs"
            referencedColumns: ["id"]
          },
        ]
      }
      ubs: {
        Row: {
          cnes: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cnes?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cnes?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "agente" | "coordenador" | "auditor"
      falta_status: "pendente" | "aprovada" | "rejeitada"
      ficha_status: "rascunho" | "enviada" | "validada"
      os_prioridade: "baixa" | "media" | "alta" | "urgente"
      os_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      ponto_tipo: "entrada" | "saida" | "intervalo_inicio" | "intervalo_fim"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["agente", "coordenador", "auditor"],
      falta_status: ["pendente", "aprovada", "rejeitada"],
      ficha_status: ["rascunho", "enviada", "validada"],
      os_prioridade: ["baixa", "media", "alta", "urgente"],
      os_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      ponto_tipo: ["entrada", "saida", "intervalo_inicio", "intervalo_fim"],
    },
  },
} as const
