package com.myexpenses

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Emits a `smsReceived` JS event `{ sender, body, timestamp }` for every
 * incoming SMS while `startListening()` is active. Parsing (which bank,
 * expense vs income) all happens in JS — see src/services/smsParser.ts —
 * this module's only job is getting the raw sender/body across the bridge.
 *
 * Registered as a dynamic (not manifest-declared) receiver: it only listens
 * while the app process is alive, which matches how this feature is used —
 * a best-effort convenience while the app happens to be running, not a
 * background service. RECEIVE_SMS/READ_SMS are requested at runtime via
 * PermissionsAndroid from JS; this module assumes they're already granted.
 */
class SmsListenerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var receiver: BroadcastReceiver? = null

  override fun getName() = "SmsListener"

  private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  @ReactMethod
  fun startListening() {
    if (receiver != null) return

    receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        for (message in messages) {
          val params = Arguments.createMap().apply {
            putString("sender", message.originatingAddress ?: "")
            putString("body", message.messageBody ?: "")
            putDouble("timestamp", message.timestampMillis.toDouble())
          }
          sendEvent("smsReceived", params)
        }
      }
    }

    reactApplicationContext.registerReceiver(
      receiver,
      IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION),
    )
  }

  @ReactMethod
  fun stopListening() {
    receiver?.let {
      reactApplicationContext.unregisterReceiver(it)
      receiver = null
    }
  }

  // Required by RN's NativeEventEmitter contract — no-op since the receiver
  // is managed explicitly via startListening()/stopListening() above.
  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}
}
