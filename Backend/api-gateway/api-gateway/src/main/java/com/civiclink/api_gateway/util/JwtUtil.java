package com.civiclink.api_gateway.util;


import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;

@Component
public class JwtUtil {

        @Value("${jwt.secret}")
        private String secret;

        public void validateToken(final String token){
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
        }
        public String extractEmail(final String token){
            return Jwts.parser().verifyWith(getSigningKey()).build().parseClaimsJws(token).getPayload().getSubject();
        }
        public String extractRole(final String token){
            return Jwts.parser().verifyWith(getSigningKey()).build().parseClaimsJws(token).getPayload().get("role",String.class);
        }
        private SecretKey getSigningKey(){
            byte[] keyBytes= Decoders.BASE64.decode(secret);
            return Keys.hmacShaKeyFor(keyBytes);
        }

}
