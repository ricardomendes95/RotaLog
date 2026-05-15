package expo.modules.pipandroid

import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PipAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PipAndroid")

    Function("setup") {
      val activity = appContext.currentActivity ?: return@Function null
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(9, 16))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          builder.setAutoEnterEnabled(true)
        }
        activity.setPictureInPictureParams(builder.build())
      }
      null
    }

    Function("enter") {
      val activity = appContext.currentActivity ?: return@Function null
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val params = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(9, 16))
          .build()
        activity.enterPictureInPictureMode(params)
      }
      null
    }

    Function("isInPip") {
      val activity = appContext.currentActivity ?: return@Function false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        activity.isInPictureInPictureMode
      } else {
        false
      }
    }

    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    }
  }
}
