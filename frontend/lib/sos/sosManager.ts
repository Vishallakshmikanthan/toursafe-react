/**
 * SosManager
 * Provides functions to dispatch emergency SMS alerts and initiate emergency phone calls.
 */

import { Linking, Platform } from "react-native";

export class SosManager {
  /**
   * Dispatch an emergency SMS to a recipient phone number
   */
  public static async sendSosSms(phoneNumber: string, message: string): Promise<boolean> {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    const separator = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${cleanNumber}${separator}body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        await Linking.openURL(`sms:${cleanNumber}`);
        return true;
      }
    } catch (err) {
      console.warn("[SosManager] SMS dispatch note:", err);
      return false;
    }
  }

  /**
   * Initiate an emergency direct voice call
   */
  public static async makeEmergencyCall(phoneNumber: string): Promise<boolean> {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    const url = `tel:${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[SosManager] Emergency call error:", err);
      return false;
    }
  }
}
