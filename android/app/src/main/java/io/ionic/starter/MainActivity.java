package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
// Importamos el plugin manualmente
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Registramos el plugin ANTES de que se cree la actividad
    registerPlugin(GoogleAuth.class);
    super.onCreate(savedInstanceState);
  }
}
