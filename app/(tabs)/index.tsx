import { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform, StyleSheet, Alert } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Display the alert as a pop-up
    shouldPlaySound: true, // Optional: Play sound with the notification
    shouldSetBadge: true, // Optional: Set the app badge icon
  }),
});

export default function HomeScreen() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Function to request push notification permissions and get the token
  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Failed to get push token for push notification!"
        );
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
      setExpoPushToken(token);
    } else {
      Alert.alert(
        "Device Error",
        "Must use physical device for Push Notifications"
      );
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX, // Ensures pop-up behavior
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listener for incoming notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);

        // Optional: Pop-up alert to display notification details when received
        Alert.alert(
          notification.request.content.title!,
          notification.request.content.body!
        );
      });

    // Listener for notification interaction (response)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Function to trigger a local notification
  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've got mail! 📬",
        body: "Here is the notification body",
        data: { data: "goes here" },
      },
      trigger: { seconds: 2 }, // Notification will trigger in 2 seconds
    });
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>Title: {notification?.request?.content?.title}</Text>
        <Text>Body: {notification?.request?.content?.body}</Text>
        <Text>Data: {notification?.request?.content?.data?.data}</Text>
      </View>
      <Button title="Press to send notification" onPress={sendNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#4287f5",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
    width: "90%",
    textAlign: "center",
  },
  text: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
    color: "red",
  },
});
