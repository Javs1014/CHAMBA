{ pkgs, ... }: {
  # Canal de paquetes estable
  channel = "stable-24.11";

  # Herramientas necesarias para tu carrera de TICS (Node, Firebase CLI, etc.)
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
  ];

  # Variables de entorno (opcional)
  env = {
    PORT = "9002";
  };

  # Extensiones útiles para tu proyecto
  idx.extensions = [
    "bradlc.vscode-tailwindcss"
    "dsznajder.es7-react-js-snippets"
  ];

  # Configuración de la Vista Previa (basada en tu manual)
  idx.previews = {
    enable = true;
    previews = {
      web = {
        # Comando para Next.js con el host 0.0.0.0 requerido por la nube
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
        manager = "web";
        
        # ESTA ES LA CLAVE: Entramos a la carpeta donde está tu código
        cwd = "CHAMBA/studio";
      };
    };
  };
}