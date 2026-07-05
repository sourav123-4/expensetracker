package com.myexpenses

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Speech-to-text for the Quick Add box, using Android's built-in
 * SpeechRecognizer — no third-party dependency, no network cost beyond
 * whatever the OS's own recognizer uses. Emits JS events `voicePartialResult`
 * / `voiceResult` (both `{ text }`), `voiceError` (`{ message }`), and
 * `voiceEnd` (no payload). SpeechRecognizer instances must be created and
 * driven from the same thread (the main/UI thread here).
 */
class VoiceInputModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var recognizer: SpeechRecognizer? = null

  override fun getName() = "VoiceInput"

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  private fun emitError(message: String) {
    sendEvent("voiceError", Arguments.createMap().apply { putString("message", message) })
  }

  private fun firstResult(bundle: Bundle?): String? =
    bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()

  @ReactMethod
  fun startListening() {
    UiThreadUtil.runOnUiThread {
      if (!SpeechRecognizer.isRecognitionAvailable(reactApplicationContext)) {
        emitError("Speech recognition isn't available on this device")
        return@runOnUiThread
      }

      recognizer?.destroy()

      val rec = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
      recognizer = rec

      rec.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}

        override fun onError(error: Int) {
          emitError(errorMessage(error))
          sendEvent("voiceEnd", null)
        }

        override fun onResults(results: Bundle?) {
          firstResult(results)?.takeIf { it.isNotBlank() }?.let {
            sendEvent("voiceResult", Arguments.createMap().apply { putString("text", it) })
          }
          sendEvent("voiceEnd", null)
        }

        override fun onPartialResults(partialResults: Bundle?) {
          firstResult(partialResults)?.takeIf { it.isNotBlank() }?.let {
            sendEvent("voicePartialResult", Arguments.createMap().apply { putString("text", it) })
          }
        }
      })

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactApplicationContext.packageName)
      }
      rec.startListening(intent)
    }
  }

  @ReactMethod
  fun stopListening() {
    UiThreadUtil.runOnUiThread {
      recognizer?.stopListening()
    }
  }

  private fun errorMessage(error: Int): String = when (error) {
    SpeechRecognizer.ERROR_NO_MATCH -> "Didn't catch that — try again"
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Didn't hear anything — try again"
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is required"
    SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network error — try again"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Still listening — try again in a moment"
    else -> "Couldn't understand — try again"
  }

  // Required by RN's NativeEventEmitter contract — events are pushed as they happen above.
  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}
}
