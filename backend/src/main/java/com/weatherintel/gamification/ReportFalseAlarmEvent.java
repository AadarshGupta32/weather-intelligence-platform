package com.weatherintel.gamification;

import com.weatherintel.entity.Report;
import org.springframework.context.ApplicationEvent;

public class ReportFalseAlarmEvent extends ApplicationEvent {

    private final Report report;
    private final String reason;

    public ReportFalseAlarmEvent(Object source, Report report, String reason) {
        super(source);
        this.report = report;
        this.reason = reason;
    }

    public Report getReport() { return report; }
    public String getReason() { return reason; }
}
