package com.backend.laissezpasserservice.jobs;

import com.backend.laissezpasserservice.dao.entities.LaissezPasser;
import com.backend.laissezpasserservice.dao.entities.LaissezPasserNotification;
import com.backend.laissezpasserservice.dao.enums.LaissezPasserStatut;
import com.backend.laissezpasserservice.dao.repositories.LaissezPasserRepository;
import com.backend.laissezpasserservice.dao.repositories.LaissezPasserNotificationRepository;
import com.backend.laissezpasserservice.services.EmailService;
import com.backend.laissezpasserservice.services.KeycloakUserService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class LaissezPasserScheduler {

    private final LaissezPasserRepository lpRepo;
    private final EmailService emailService;
    private final LaissezPasserNotificationRepository notifRepo;
    private final KeycloakUserService keycloakUserService;

    public LaissezPasserScheduler(
            LaissezPasserRepository lpRepo,
            EmailService emailService,
            LaissezPasserNotificationRepository notifRepo,
            KeycloakUserService keycloakUserService
    ) {
        this.lpRepo = lpRepo;
        this.emailService = emailService;
        this.notifRepo = notifRepo;
        this.keycloakUserService = keycloakUserService;
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void checkExpirations() {

        LocalDate today = LocalDate.now();

        for (LaissezPasser lp : lpRepo.findAll()) {

            if (lp.getDateExpiration() == null) continue;

            long daysLeft = ChronoUnit.DAYS.between(today, lp.getDateExpiration());

            // ================= EXPIRED =================
            if (daysLeft <= 0) {

                boolean alreadySent = notifRepo
                        .findTopByLaissezPasserIdAndTypeOrderBySentAtDesc(lp.getId(), "EXPIRED")
                        .isPresent();

                if (!alreadySent) {

                    sendEmail(lp,
                            "❌ Laissez-Passer Expiré",
                            "Votre laissez-passer " + lp.getNumLaissezPasser() + " est expiré.");

                    saveNotif(lp.getId(), "EXPIRED");
                }

                lp.setStatut(LaissezPasserStatut.EXPIRE);
                lpRepo.save(lp);
            }

            // ================= EXPIRING =================
            else if (daysLeft <= 30) {

                LaissezPasserNotification last = notifRepo
                        .findTopByLaissezPasserIdAndTypeOrderBySentAtDesc(lp.getId(), "EXPIRING_30")
                        .orElse(null);

                boolean shouldSend =
                        last == null ||
                                ChronoUnit.DAYS.between(last.getSentAt(), LocalDateTime.now()) >= 7;

                if (shouldSend) {

                    sendEmail(lp,
                            "⚠️ Laissez-Passer bientôt expiré",
                            "Expire dans " + daysLeft + " jour(s)");

                    saveNotif(lp.getId(), "EXPIRING_30");
                }
            }
        }
    }

    private void sendEmail(LaissezPasser lp, String subject, String body) {
        String email = getUserEmail(lp);
        emailService.sendEmail(email, subject, body);
    }

    private String getUserEmail(LaissezPasser lp) {

        if (lp.getUserId() == null) {
            throw new RuntimeException("UserId missing");
        }

        return keycloakUserService.getUserEmail(lp.getUserId());
    }

    private void saveNotif(Long lpId, String type) {
        LaissezPasserNotification n = new LaissezPasserNotification();
        n.setLaissezPasserId(lpId);
        n.setType(type);
        n.setSentAt(LocalDateTime.now());
        notifRepo.save(n);
    }
}