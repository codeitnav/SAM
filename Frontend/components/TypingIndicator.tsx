"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"

interface TypingIndicatorProps {
  isVisible: boolean
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isVisible) {
      const animateDots = () => {
        const createDotAnimation = (dot: Animated.Value, delay: number) => {
          return Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        }

        Animated.loop(
          Animated.parallel([
            createDotAnimation(dot1, 0),
            createDotAnimation(dot2, 200),
            createDotAnimation(dot3, 400),
          ]),
        ).start()
      }

      animateDots()
    } else {
      // Reset animations when not visible
      dot1.setValue(0)
      dot2.setValue(0)
      dot3.setValue(0)
    }
  }, [isVisible, dot1, dot2, dot3])

  if (!isVisible) return null

  return (
    <View style={styles.container}>
      <View style={styles.typingContainer}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot1,
                transform: [
                  {
                    scale: dot1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot2,
                transform: [
                  {
                    scale: dot2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot3,
                transform: [
                  {
                    scale: dot3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  typingContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    maxWidth: "80%",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
    marginHorizontal: 2,
  },
})

export default TypingIndicator
