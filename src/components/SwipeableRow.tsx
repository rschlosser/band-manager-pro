import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Pressable } from "react-native";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "../theme";

function DeleteAction({
  translation,
  onPress,
}: {
  translation: SharedValue<number>;
  onPress: () => void;
}) {
  const { colors, radii } = useTheme();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.min(translation.value + 84, 0) }],
  }));

  return (
    <Animated.View style={[{ width: 84, alignItems: "center", justifyContent: "center" }, style]}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.red,
          width: 60,
          height: "76%",
          borderRadius: radii.lg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export function SwipeableRow({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const ref = useRef<SwipeableMethods>(null);

  return (
    <Swipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, translation) => (
        <DeleteAction
          translation={translation}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            ref.current?.close();
            onDelete();
          }}
        />
      )}
    >
      {children}
    </Swipeable>
  );
}
