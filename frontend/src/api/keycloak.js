import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "ram-badges",
    clientId: "ram-badges-client"
});

export default keycloak;