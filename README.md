# 🏊‍♂️ Liga Galega de Clubs de Natación - Swimming Team Manager

Xogo de xestión deportiva en local e gráficos sinxelos en 2D, baseado na normativa oficial da **Federación Galega de Natación (FEGAN)** (*Circular 26-14 - Tempada 2026/27*).

---

## 🌟 Características Principais

### 1. Sistema Oficial de Divisións Galegas (FEGAN)
O xogo reproduce fielmente as catro divisións oficiais galegas cos clubs reais da circular:
- **División de Honra (6 clubs):** CN Portamiñá, CN Galaico, CN Ferrol, CN Pabellón Ourense, C Fluvial Lugo, CN Arteixo.
- **1ª División (6 clubs):** CN Ponteareas, CDN Cidade Santiago, Sporting Casino A Coruña, AD Fogar, RCN Vigo, ADN Narón.
- **2ª División (6 clubs):** CN Coruña, CN Vigo Rías Baixas, CN Panas, CN Mos, C Del Mar, SD Boiro.
- **3ª División (7 clubs + Club do Xogador):** C Marina Ferrol, CN Monforte, CN Liceo, CN Xove, CN Ordes, CN Vilagarcía, CN Redondela e o teu club persoal (ex. *CN Riazor*).

### 2. Estructura da Tempada (Setembro a Maio - 36 Semanas)
- **Fase Previa:** 3 xornadas cunha orde de programas por sorteo (*Xornada A, Xornada B e Xornada C*).
  - Puntuación en probas individuais:
    - División de Honra, 1ª e 2ª División: `15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1` pts.
    - 3ª División: `17, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1` pts.
    - As remudas puntúan o dobre.
  - Puntuación por xornada: cada xornada asigna puntos á clasificación xeral da liga (`7, 5, 4, 3, 2, 1` en 6 clubs; `8, 6, 5, 4, 3, 2, 1` en 3ª División).
- **Corte de Fase Previa:**
  - En Honra, 1ª e 2ª: Os 3 primeiros disputan a Fase Final polo Título/Ascenso; os 3 últimos loitan no Grupo de Permanencia.
  - En 3ª División: Os 6 mellores clubs pasan á Fase Final polo Título e Ascenso.
- **Fase Final:** Unha xornada completa de dobre sesión (*Sesión 1 matinal ás 10:30 e Sesión 2 de tarde ás 17:00*).
- **Ascensos e Descensos:** Ao final da tempada, os 2 últimos de cada división descenden á inmediatamente inferior, e os 2 primeiros ascenden.

### 3. Os 8 Atributos dos Nadadores & Motor de Rendemento
Cada nadador conta cos 8 atributos fundamentais:
1. **Velocidade (`speed`):** Frecuencia de brazada, reacción na saída e chispa anaeróbica.
2. **Fondo / Resistencia (`distance`):** Capacidade aeróbica, mantemento de ritmo e tolerancia ao ácido láctico.
3. **Forza / Potencia (`strength`):** Impulso no salto desde o bloque, viraxes na parede e batido subacuático de golfiño.
4. **Técnica Crol (`freestyle`):** Eficiencia hidrodinámica e posición corporal en crol.
5. **Técnica Costas (`backstroke`):** Rulado dorsal e recuperación de brazos en costas.
6. **Técnica Braza (`breaststroke`):** Patada circular de braza e coordinación tracción-deslizamento.
7. **Técnica Bolboreta (`butterfly`):** Ondulación corporal e tracción simultánea de bolboreta.
8. **Técnica Estilos (`IM`):** Transicións entre estilos e polivalencia nas 4 disciplinas.

### 4. Sistema Dinámico de Fatiga & Factor Aleatorio
- **Fatiga Crónica:** Carga acumulada semana tras semana polos adestramentos de alto volume.
- **Fatiga Aguda:** Cansaço inmediato do microciclo actual.
- **Fatiga en Competición:** Durante o día da xornada, cada proba nadada suma fatiga dependendo da distancia (50m suma menos que 1500m). O descanso entre probas no programa oficial permite recuperar forzas (maior separación entre probas = mellor recuperación).
- **Factor Aleatorio:** Unha variación estocástica realista (±1.2%) simula o tempo de reacción no bloque, a precisión nas viraxes e as sensacións do nadador no día da proba.

### 5. Periodización do Adestramento & Contemporización de Cargas
Planifica e contemporiza libremente a tempada de Setembro a Maio:
- **Tipos de Carga Dispoñibles Semana a Semana:**
  - **🟢 Base Aeróbica (Volume alto, intensidade moderada)**: Constrúe capacidade cardiovascular e fondo.
  - **🔵 Preparación Específica & Forza (Intensidade alta, limiar e pesas)**: Desenvolve forza explosiva e estilos.
  - **🟡 Ritmo Competitivo & Velocidade (Series a ritmo de proba e VO2Max)**: Afina a velocidade punta e saídas.
  - **🟣 Descarga / Taper (Redución drástica de volume ao -50%)**: Elimina a fatiga acumulada mantendo a chispa. Ideal para colocar a semana previa a unha xornada e acadar o pico de rendemento (**supercompensación**) con mellores marcas persoais (PB).
  - **⚪ Recuperación Activa**: Sesións suaves de rexeneración post-competición.
  - **💤 Descanso Total / Descarga Profunda**: Baixada máxima de volume para eliminar calquera risco de esgotamento.
- **Ferramentas de Contemporización no Panel de Adestramento:**
  - **Axuste Inmediato da Semana Actual:** Modifica o tipo de carga da semana en curso antes de avanzar.
  - **⚡ Botón "Programar Descargas antes das 4 Xornadas":** Programa cun só clic as semanas de taper previas á Xornada A (Sem 8), Xornada B (Sem 17), Xornada C (Sem 25) e Fase Final (Sem 33).
  - **Ferramenta de Rango (Bloques):** Aplica calquera tipo de adestramento a un bloque de semanas (ex. semanas 10 a 14).
  - **Calendario Interactivo das 36 Semanas:** Permite trocar individualmente calquera semana futura con menús despregables.
- **Grupos de Adestramento Especializados:**
  - Posibilidade de dividir o equipo en grupos (*Velocistas, Fondistas, Estilistas e Grupo Xeral*), personalizando volume (km/sem), repartición de intensidades (% aeróbico, limiar, velocidade) e foco de estilo.

### 6. Mercado de Fichaxes & Instalacións
- Oxea e ficha nadadores libres de toda Galicia, ou vende nadadores do teu cadro para ingresar diñeiro.
- Inviste en 7 categorías de equipamento:
  - *Pull-buoys e táboas básicas* (+6% aproveitamento xeral).
  - *Set de aletas curtas e tubos frontais* (+10% técnica de pés).
  - *Gomas de resistencia e paracaídas* (+15% velocidade).
  - *Ximnasio de forza e halterofilia* (+20% potencia).
  - *Cámaras 4K subacuáticas de análise biomecánica* (+22% estilos).
  - *Centro de crioterapia e masaxe de descarga* (recuperación de fatiga 50% máis rápida).
  - *Plataformas Omega con cuña de saída e placas electrónicas* (-0.15s en reaccións e cambios de remudas).

### 7. Convocatoria & Normativa FEGAN (Circular 26-14)
- **Selección de convocatoria a semana previa**:
  - Máximo 2 nadadores por proba individual por club.
  - En 3ª División preliminar: límite de 1 nadador en 400m, 800m e 1500m se hai máis de 6 clubs.
  - Máximo 2 probas individuais por nadador por xornada/sesión (+ remudas).
  - Máximo 6 probas individuais na Fase Previa e 4 na Fase Final por nadador.
  - Botón de **Auto-Completar con IA**: un algoritmo intelixente que optimiza as probas para maximizar os puntos do club cumprindo tódalas regras.
- **Cámara de Chamadas (45 min antes da sesión - Art. 3.7)**:
  - Posibilidade de comprobar o estado físico matinal e facer baixas/substitucións cos reservas ou trocar a orde dos relevistas.

### 8. Simulación 2D en Vivo con Canvas & Son
- Vista visual en 2D da piscina con 6 a 8 rúas.
- Balizas de cores (vermello, branco e azul), bloques de saída Omega e placas amarelas de crono electrónico.
- Animacións anatómicas segundo o estilo (*crol con batido, costas con rulado dorsal, braza con patada simultánea e bolboreta con dobre brazo e onda*).
- Viraxes con salpicaduras de auga e impulsos na parede.
- Efectos de son sintetizados con Web Audio API (*asubío de saída, chifre electrónico "BEEP", salpicaduras e aplausos do público*).
- Controis de velocidade (1x, 2x, 5x, pausa e salto ao final).

### 9. Niveis de Dificultade
- **Promesa (Fácil):** 25.000 € de inicio, crecemento rápido (+30%), menos fatiga e IA permisiva.
- **Federado (Normal):** 12.000 € de inicio, economía realista galega e progreso estándar.
- **División de Honra (Difícil):** 5.000 € de inicio, alta esixencia física, caída de atributos se se descoidan e clubs rivais de alto nivel.

---

## 🚀 Como Xogar en Local

Non cómpre instalar librerías pesadas nin bases de datos. Todo funciona en calquera navegador moderno.

### Opción 1: Executar co servidor Python incluído
No directorio do proxecto:
```bash
python3 server.py
# ou con npm:
npm start
```
Abre no teu navegador: [http://localhost:8080](http://localhost:8080)

### Opción 2: Calquera servidor web local
```bash
python3 -m http.server 8080
# ou
npx serve .
```

---

## 💾 Gardado e Exportación
- **Autogardado:** O progreso gárdase automaticamente no navegador (`localStorage`).
- **Exportar Partida:** Podes descargar a túa partida nun arquivo `.json` en calquera momento co botón `💾 Gardar`.
- **Cargar Partida:** Recupera calquera partida gardada co botón `📂 Cargar`.
