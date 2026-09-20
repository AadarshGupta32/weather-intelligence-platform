package com.weatherintel.gamification;

import com.weatherintel.entity.Report;
import org.springframework.context.ApplicationEvent;

public class ReportVerifiedEvent extends ApplicationEvent {

    private final Report report;
    private final String verifiedBy;

    public ReportVerifiedEvent(Object source, Report report, String verifiedBy) {
        super(source);
        this.report = report;
        this.verifiedBy = verifiedBy;
    }

    public Report getReport() { return report; }
    public String getVerifiedBy() { return verifiedBy; }
}
