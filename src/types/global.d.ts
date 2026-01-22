declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";
declare module "recompose";
declare module "react-awesome-slider";

// For components that use "component" prop in Route (v5)
declare namespace React {
    interface Component {
        props: any;
    }
}
