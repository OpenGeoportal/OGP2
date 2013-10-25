package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateUserRequestJson {
/*
  {
    "user": {
        "full_name": "Tim MacSmith",
        "login": "tim",
        "password": "secretpassword",
        "password_confirmation": "secretpassword",
        "email": "tim@geocommons.com"
    }
} 
 */
	@JsonProperty("user")
	User user;
	
	CreateUserRequestJson (){
		this.user = new User();
	}
	
	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public class User {
		String full_name;
		String login;
		String password;
		String password_confirmation;
		String email;
		
		public String getFull_name() {
			return full_name;
		}
		public void setFull_name(String full_name) {
			this.full_name = full_name;
		}
		public String getLogin() {
			return login;
		}
		public void setLogin(String login) {
			this.login = login;
		}
		public String getPassword() {
			return password;
		}
		public void setPassword(String password) {
			this.password = password;
		}
		public String getPassword_confirmation() {
			return password_confirmation;
		}
		public void setPassword_confirmation(String password_confirmation) {
			this.password_confirmation = password_confirmation;
		}
		public String getEmail() {
			return email;
		}
		public void setEmail(String email) {
			this.email = email;
		}
	}
}
