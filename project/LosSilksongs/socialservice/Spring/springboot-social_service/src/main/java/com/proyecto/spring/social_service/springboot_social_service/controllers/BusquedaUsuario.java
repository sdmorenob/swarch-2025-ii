package com.proyecto.spring.social_service.springboot_social_service.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BusquedaUsuario {

    @GetMapping("/busqueda_usuario")

    public String info(Model model) {

        return "busqueda_usuario";

    }

}
