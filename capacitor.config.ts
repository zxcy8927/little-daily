import type {CapacitorConfig} from '@capacitor/cli'
// Testing identifier only. Replace with the owner's identifier before signing.
const config:CapacitorConfig={appId:'app.littledaily.preview',appName:'Little Daily',webDir:'dist',backgroundColor:'#f4f1e8',android:{allowMixedContent:false},plugins:{LocalNotifications:{smallIcon:'ic_stat_daily',iconColor:'#405a3d'}}}
export default config
