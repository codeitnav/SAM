// WebSocket configuration - Update this to your actual backend URL
const WS_URL = "ws://<ip-address>/api/v1/ask-sam?store_id=1"

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  error?: boolean
}

export interface WebSocketMessage {
  type: "user_message" | "bot_response" | "typing_start" | "typing_end" | "error"
  message?: string
  error?: string
  timestamp?: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private messageHandlers: ((message: WebSocketMessage) => void)[] = []
  private connectionHandlers: ((connected: boolean) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private pingInterval: NodeJS.Timeout | null = null

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      console.log("Already connecting or connected")
      return
    }

    this.isConnecting = true
    console.log("Attempting to connect to:", WS_URL)

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL)

        this.ws.onopen = () => {
          console.log("WebSocket connected successfully")
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startPing()
          this.notifyConnectionHandlers(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          console.log("Raw WebSocket message received:", event.data)
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            console.log("Parsed WebSocket message:", message)
            this.notifyMessageHandlers(message)
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
            console.error("Raw message data:", event.data)

            // Try to handle as plain text response
            this.notifyMessageHandlers({
              type: "bot_response",
              message: event.data,
              timestamp: new Date().toISOString(),
            })
          }
        }

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected. Code:", event.code, "Reason:", event.reason)
          this.isConnecting = false
          this.stopPing()
          this.notifyConnectionHandlers(false)

          // Only attempt reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            this.handleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          this.isConnecting = false
          this.notifyConnectionHandlers(false)
          reject(error)
        }

        // Set a timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            console.log("WebSocket connection timeout")
            this.isConnecting = false
            if (this.ws) {
              this.ws.close()
            }
            reject(new Error("WebSocket connection timeout"))
          }
        }, 10000) // 10 second timeout
      } catch (error) {
        this.isConnecting = false
        console.error("Failed to create WebSocket:", error)
        reject(error)
      }
    })
  }

  private startPing(): void {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.ws!.send(JSON.stringify({ type: "ping" }))
        } catch (error) {
          console.error("Error sending ping:", error)
        }
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error)
        })
      }, this.reconnectDelay * this.reconnectAttempts) // Exponential backoff
    } else {
      console.log("Max reconnection attempts reached")
    }
  }

  disconnect(): void {
    console.log("Manually disconnecting WebSocket")
    this.stopPing()
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect")
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  sendMessage(message: string): boolean {
    if (!this.isConnected()) {
      console.log("WebSocket not connected, cannot send message")
      return false
    }

    try {
      const wsMessage: WebSocketMessage = {
        type: "user_message",
        message: message,
        timestamp: new Date().toISOString(),
      }

      console.log("Sending WebSocket message:", wsMessage)
      this.ws!.send(JSON.stringify(wsMessage))
      return true
    } catch (error) {
      console.error("Error sending message:", error)
      return false
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler)
  }

  private notifyMessageHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        console.error("Error in message handler:", error)
      }
    })
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected)
      } catch (error) {
        console.error("Error in connection handler:", error)
      }
    })
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): number {
    return this.ws?.readyState || WebSocket.CLOSED
  }

  getUrl(): string {
    return WS_URL
  }
}

export default new WebSocketService()
