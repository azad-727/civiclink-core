package com.civiclink.auth_service.repository;

import com.civiclink.auth_service.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    @Query("{ '_id' : ?0 }")
    Optional<User> findByCustomId(String id);

    boolean existsByEmail(String email);
}
