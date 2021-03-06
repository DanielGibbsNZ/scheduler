import {AppModule} from "../app/app.module";
import {Logger, LoggingService} from "ionic-logging-service";
import {MockConfigurationService} from "../app/logging-configuration";

export class LoggingWrapper {
    static loggingService: LoggingService;

    static getLogger(name: string): Logger {
        if (AppModule.injector) {
            return AppModule.injector.get(LoggingService).getLogger(name);
        } else {
            if (!this.loggingService) {
                let config = new MockConfigurationService(null);
                config.setVars({
                    "logging": {
                        "logLevels": [
                            {
                                "loggerName": "root",
                                "logLevel": "INFO"
                            }
                        ]
                    }
                });
                this.loggingService = new LoggingService(config);
            }
            // console.log("oBeTruthy()re instantiation in the hope it all works");
            return this.loggingService.getLogger(name);
        }
    }
}
