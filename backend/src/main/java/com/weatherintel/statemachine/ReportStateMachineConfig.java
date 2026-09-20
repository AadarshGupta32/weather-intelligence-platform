package com.weatherintel.statemachine;

import com.weatherintel.entity.ReportEvent;
import com.weatherintel.entity.ReportStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineConfigurationConfigurer;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.listener.StateMachineListenerAdapter;
import org.springframework.statemachine.state.State;

import java.util.EnumSet;

@Configuration
@EnableStateMachineFactory
public class ReportStateMachineConfig extends EnumStateMachineConfigurerAdapter<ReportStatus, ReportEvent> {

    private static final Logger logger = LoggerFactory.getLogger(ReportStateMachineConfig.class);

    @Override
    public void configure(StateMachineConfigurationConfigurer<ReportStatus, ReportEvent> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(true)
            .listener(new StateMachineListenerAdapter<>() {
                @Override
                public void stateChanged(State<ReportStatus, ReportEvent> from, State<ReportStatus, ReportEvent> to) {
                    logger.info("Report State Transition: {} -> {}", 
                            from != null ? from.getId() : "NONE", 
                            to != null ? to.getId() : "NONE");
                }
            });
    }

    @Override
    public void configure(StateMachineStateConfigurer<ReportStatus, ReportEvent> states) throws Exception {
        states
            .withStates()
            .initial(ReportStatus.SUBMITTED)
            .states(EnumSet.allOf(ReportStatus.class))
            .end(ReportStatus.ACTIONED)
            .end(ReportStatus.FALSE_ALARM)
            .end(ReportStatus.REJECTED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<ReportStatus, ReportEvent> transitions) throws Exception {
        transitions
            // 1. SUBMITTED -> AI_CHECKED (Triggered when AI rumor & pHash analysis finishes)
            .withExternal()
                .source(ReportStatus.SUBMITTED)
                .target(ReportStatus.AI_CHECKED)
                .event(ReportEvent.EVALUATE_AI)
            .and()
            // 2. AI_CHECKED -> ADMIN_VERIFIED (Disaster cell admin verifies citizen report)
            .withExternal()
                .source(ReportStatus.AI_CHECKED)
                .target(ReportStatus.ADMIN_VERIFIED)
                .event(ReportEvent.APPROVE_ADMIN)
            .and()
            // 3. ADMIN_VERIFIED -> ACTIONED (Emergency relief / NDRF / municipal team dispatched)
            .withExternal()
                .source(ReportStatus.ADMIN_VERIFIED)
                .target(ReportStatus.ACTIONED)
                .event(ReportEvent.DISPATCH_ACTION)
            .and()
            // 4. AI_CHECKED -> FALSE_ALARM (Flagged as rumor or recycled fake media)
            .withExternal()
                .source(ReportStatus.AI_CHECKED)
                .target(ReportStatus.FALSE_ALARM)
                .event(ReportEvent.FLAG_RUMOR)
            .and()
            // 5. SUBMITTED -> FALSE_ALARM (Immediate rumor discard)
            .withExternal()
                .source(ReportStatus.SUBMITTED)
                .target(ReportStatus.FALSE_ALARM)
                .event(ReportEvent.FLAG_RUMOR)
            .and()
            // 6. Rejections
            .withExternal()
                .source(ReportStatus.AI_CHECKED)
                .target(ReportStatus.REJECTED)
                .event(ReportEvent.REJECT);
    }
}
