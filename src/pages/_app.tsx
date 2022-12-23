import { type AppType } from "next/app";
import "../styles/globals.css";

const Motes: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default Motes;
