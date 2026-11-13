package com.giulia.dndacademy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Login and Bearer authentication use our persisted users; no default in-memory user.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class DndacademyApplication {

	public static void main(String[] args) {
		SpringApplication.run(DndacademyApplication.class, args);
	}

}
