package org.opengeoportal.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.ldap.userdetails.UserDetailsContextMapper;
import org.springframework.security.web.access.expression.DefaultWebSecurityExpressionHandler;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Value("${login.method:}")
    String loginMethod;

    @Value("${login.in_memory.user:")
    String inMemoryUser;

    @Value("${login.in_memory.password:")
    String inMemoryPass;

    @Value("${login.ldap.usersearchbase:}")
    String userSearchBase;

    @Value("${login.ldap.usersearchfilter:(uid={0})}")
    String userSearchFilter;

    @Value("${login.ldap.url:}")
    String ldapUrl;

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Autowired
    LayerPermissionEvaluator layerPermissionEvaluator;

    @Autowired
    @Qualifier("ogpUserDetailsContextMapper")
    UserDetailsContextMapper userDetailsContextMapper;

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        // we can build the appropriate authmanager based on config
        if (loginMethod.isBlank()) {
            throw new Exception("login.method must be set");
        }
        if (loginMethod.trim().equalsIgnoreCase("in_memory")) {
            if (inMemoryUser.isBlank() || inMemoryPass.isBlank()) {
                throw new Exception("username and password must be set for InMemory Authentication");
            }
            auth.inMemoryAuthentication()
                    .withUser(inMemoryUser).password("{noop}" + inMemoryPass)
                    .authorities("ROLE_USER");
        } else if (loginMethod.trim().equalsIgnoreCase("ldap")) {
            if (ldapUrl.isBlank()){
                throw new Exception("login.ldap.url is required to use ldap authentication");
            }
            auth.ldapAuthentication()
                    .userDetailsContextMapper(userDetailsContextMapper)
                    .userSearchFilter(userSearchFilter)
                    .contextSource()
                    .url(ldapUrl);
        }
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        DefaultWebSecurityExpressionHandler handler = new DefaultWebSecurityExpressionHandler();
        handler.setPermissionEvaluator(layerPermissionEvaluator);
        web.expressionHandler(handler);

        web.ignoring()
                .antMatchers("/resources/**")
                .antMatchers("/javascript/**")
                .antMatchers("/css/**")
                .antMatchers("/media/**");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                .and()
                .authorizeRequests()
                .antMatchers("/restricted/**").authenticated()
                .anyRequest().permitAll()
                .and()
                .logout()
                .logoutUrl("/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessUrl("/logoutResponse")
                .and().cors();
    }

}