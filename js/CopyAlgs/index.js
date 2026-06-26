import { Config } from "../Common/Common.js";
import { BiService } from "../BI/bi.js";
import { AlgCopyController } from './controllers/AlgCopyController.js';

function run() {
	var config = new Config();
    config.Initialize();
	
	var bi = new BiService(config);
	
	var deps = {
        bi: bi
    };	
	
    const controller = new AlgCopyController(deps);
    controller.init();
    return controller;
}

export default run;
