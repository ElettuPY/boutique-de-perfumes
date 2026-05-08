---
description: description: "Detecta cambios y actualiza el repositorio de GitHub automáticamente"
---


# Se activa cuando tú lo pides o cuando guardas archivos clave
on:
  manual_trigger: true
  file_change: ["index.html", "css/*.css", "js/*.js", "README.md"]

# Reglas para que Gemini sea inteligente al actualizar
system_rules: |
  1. Analiza qué archivos cambiaron usando 'git status'.
  2. Crea un mensaje de commit que explique EL CAMBIO (ej: "Ajuste de colores" o "Nuevo perfume").
  3. No subas archivos pesados o innecesarios.
  4. Si hay conflictos, intenta resolverlos a favor de la versión local.

steps:
  - name: "Auto-Push"
    action: "shell"
    command: |
      # Cargar variables del .env
      export $(grep -v '^#' .env | xargs)
      
      # Configurar el remoto con el token por si acaso
      REMOTE_URL="https://${GH_TOKEN}@github.com/${GH_USER}/${GH_REPO}.git"
      
      # Proceso de actualización
      git add .
      
      # Gemini generará el mensaje basado en los cambios
      COMMIT_MSG="Update: $(date +'%Y-%m-%d %H:%M')"
      git commit -m "$COMMIT_MSG"
      
      git push origin main
      echo "✅ Web actualizada en GitHub Pages"