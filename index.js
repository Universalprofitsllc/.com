const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();

// 🚀 Este CronJob de Servidor reemplazará la vulnerabilidad crítica del navegador.
// Se ejecuta cada día automáticamente a las 6:00 PM (hora Santo Domingo).
exports.dailyProfits = onSchedule(
  {
    schedule: "every day 18:00",
    timeZone: "America/Santo_Domingo",
  },
  async (event) => {
    logger.info("Iniciando distribución de utilidades del fondo...");

    // Si es fin de semana (sábado=6, domingo=0), no se pagan fondos según tu lógica de app.js
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      logger.info("Fin de semana detectado. No se envían pagos.");
      return;
    }

    const snapshot = await db.collection("users").get();
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach((doc) => {
      const u = doc.data();
      // Si el usuario no tiene inversiones, saltar.
      if (!u.investments || !Array.isArray(u.investments)) return;

      let totalAddedToBalance = 0;
      let userUpdated = false;

      u.investments.forEach((inv) => {
        if (!inv.active) return; // Si la inversión finalizó (o sea, alcanzó el 200%), ignorar.

        const amount = parseFloat(inv.amount || 0);
        let currentEarnings = parseFloat(inv.earnings || 0);
        const maxEarnings = amount * 2;

        if (currentEarnings >= maxEarnings) {
          inv.active = false;
          userUpdated = true;
          return;
        }

        // Lógica de cálculo de porcentaje de ganancia diario: 1.25% fijo
        let dailyPct = 0.0125;
        let earningsPerDay = amount * dailyPct;

        let toAdd = earningsPerDay;
        // Evitar que el usuario pase del 200% (maxEarnings).
        if (currentEarnings + toAdd > maxEarnings) {
          toAdd = maxEarnings - currentEarnings;
        }

        inv.earnings = currentEarnings + toAdd;
        totalAddedToBalance += toAdd;
        userUpdated = true;
      });

      // Si obtuvimos ganancias para este usuario, guardamos los resultados en el Lote o Batch de Firetore.
      if (userUpdated && totalAddedToBalance > 0) {
        
        let existingBalance = parseFloat(u.balance || 0);
        u.balance = existingBalance + totalAddedToBalance;

        // Historial total
        let existingHist = parseFloat(u.totalHistoricalEarnings || u.earnings || 0);
        u.totalHistoricalEarnings = existingHist + totalAddedToBalance;
        u.earnings = u.totalHistoricalEarnings;

        const timestampStr = new Date().toISOString();
        if (!u.bonusHistory) u.bonusHistory = [];
        u.bonusHistory.push({
          from: "Sistema Total (Automático Backend)",
          amount: totalAddedToBalance,
          investedAmount: u.invested,
          date: timestampStr
        });

        // Aplicamos el cambio al Batch 
        batch.update(doc.ref, {
          investments: u.investments,
          balance: u.balance,
          totalHistoricalEarnings: u.totalHistoricalEarnings,
          earnings: u.earnings,
          bonusHistory: u.bonusHistory
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      logger.info(`Éxito. Pagos enviados a ${updatedCount} inversionistas activos de la plataforma.`);
    } else {
      logger.info("Ningún usuario recibió pagos el día de hoy.");
    }
  }
);
