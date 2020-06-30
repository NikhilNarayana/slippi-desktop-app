import _ from 'lodash';
import OBSWebSocket from 'obs-websocket-js';

export default class OBSManager extends OBSWebSocket{
  constructor(settings) {
    super();
    this.obsSourceName = settings.obsSourceName;
    this.obsIP = settings.obsIP;
    this.obsPassword = settings.obsPassword;
    this.connectAndSetupListeners();
  }
  
  updateSettings(settings) {
    this.obsSourceName = settings.obsSourceName;
    this.obsIP = settings.obsIP;
    this.obsPassword = settings.obsPassword;
    this.connectAndSetupListeners();
  }

  async connectAndSetupListeners() {
    if (this.obsIP && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      await this.connect({address: this.obsIP, password: this.obsPassword}).catch((err) => { if (err) console.log(err) });
      await this.on("SceneItemAdded", async (data) => await this.getMatchingSources()); // eslint-disable-line
      await this.on("SceneItemRemoved", async (data) => await this.getMatchingSources()); // eslint-disable-line
      await this.getMatchingSources();
    }
  }

  isConnected() {
    return ""
  }

  getMatchingSources = async (data = null) => { // eslint-disable-line
    const res = await this.obs.send("GetSceneList");
    const scenes = res.scenes || [];
    const pairs = _.flatMap(scenes, (scene) => {
      const sources = scene.sources || [];
      return _.map(sources, (source) => ({scene: scene.name, source: source.name}));
    });
    this.obsPairs = _.filter(pairs, (pair) => pair.source === this.obsSourceName);
  };

  updateSources(value) {
    _.forEach(this.obsPairs, (pair) => {
      this.obs.send("SetSceneItemProperties", 
        {"scene-name": pair.scene, "item": this.obsSourceName, "visible": value});
    });
  }
}