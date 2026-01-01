/**
 * TikTok Upload Types
 * Type definitions for TikTok image upload functionality
 */

export interface TiktokUploadResponse {
  data: {
    uri: string
    url_list: string[]
    url_prefix: string | null
  }
  extra: {
    fatal_item_ids: string[]
    logid: string
    now: number
  }
  log_pb: {
    impr_id: string
  }
  status_code: number
  status_msg: string
}

export interface TiktokUploadOptions {
  source?: number
  accountId?: string
}

export interface TiktokUploadError {
  message: string
  statusCode: number
  statusMessage: string
  accountInfo?: {
    id: string
    name: string
    status: string
    uploadCount: number
    lastUploadAt: string | null
    cooldownUntil: string | null
  }
  tiktokApiResponse?: {
    statusCode: number
    statusMessage: string
    responseBody?: unknown
  }
  requestDetails?: {
    url: string
    method: string
    headers?: Record<string, string>
  }
}

export interface TiktokUploadResult {
  success: boolean
  url?: string
  error?: string
  accountUsed?: string
}
