import { Intro } from "@/components/layout/Intro";
import "../styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";
import GridPattern from "@/components/grid-pattern";
import Script from "next/script";
import { PHProvider } from "@/components/posthog-provider";
import { getBootstrapData } from "@/utilts/get-bootstrap-data";
import { Toaster } from "sonner";
import {Toaster as ShadcnToaster} from "@/components/ui/toaster";
import { GoogleTagManager } from '@next/third-parties/google';
import AryanHeader from "@/components/aryan-component/aryan-header";
import { auth } from "@/server/auth";
import {
  getProjectById
} from "@normietech/core/config/project-registry/utils";
export const metadata: Metadata = {
  title: "Normie",
  description: "Send fiat directly into your smart contracts.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bootstrapData = await getBootstrapData();
  const session = await auth()

  return (
    <html lang="en">
      <Toaster />
      {/* <Script>
        {`
        !function(e,t,n,s,u,a)
        {e.twq ||
          ((s = e.twq =
            function () {
              s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
            }),
          (s.version = "1.1"),
          (s.queue = []),
          (u = t.createElement(n)),
          (u.async = !0),
          (u.src = "https://static.ads-twitter.com/uwt.js"),
          (a = t.getElementsByTagName(n)[0]),
          a.parentNode.insertBefore(u, a))}
        (window,document,'script'); twq('config','oqhs4');
        `}
      </Script> */}
      {/* <Script>
        {`
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_AwsxaP902GDQRKyU0jTi9edD5ekDDA3opoGTSyFuCMV',{api_host:'https://us.i.posthog.com', person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
        })
        `}
      </Script> */}
      {/* <Script type="text/javascript">
        {`
_linkedin_partner_id = "6791284";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
`}
      </Script>
      <Script type="text/javascript">
        {`
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
`}
      </Script>
      <Script type="text/javascript">
        {`
_linkedin_partner_id = "6791284";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
`}
      </Script>
      <Script type="text/javascript">
        {`
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
`}
      </Script> */}
      {/* <noscript>
        <img
          height="1"
          width="1"
          style="display:none;"
          alt=""
          src="https://px.ads.linkedin.com/collect/?pid=6791284&fmt=gif"
        />
</noscript> */}
      {/* <noscript>
        <img
          height="1"
          width="1"
          style="display:none;"
          alt=""
          src="https://px.ads.linkedin.com/collect/?pid=6791284&fmt=gif"
        />
</noscript> */}
      {/* <PHProvider bootstrapData={bootstrapData}> */}
      <GoogleTagManager gtmId="GTM-N8NVKGJ6" />
        <body
          className={`font-sans isolate antialiased relative dark min-h-screen`}
        >
          
          <GridPattern
            className="absolute -top-14 inset-x-0 -z-10 h-screen w-full dark:fill-secondary/30 fill-neutral-100 dark:stroke-secondary/30 stroke-neutral-700/5 [mask-image:linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
            yOffset={-96}
            interactive
          />
          <AryanHeader session={session} projectId={session?.user?.projectId || ""} />
          {children}
          <ShadcnToaster />
          <Footer />
          
        </body>
      {/* </PHProvider> */}
    </html>
  );
}
