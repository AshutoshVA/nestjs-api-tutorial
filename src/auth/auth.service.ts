import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable({})
export class AuthService {

    constructor(private prisma: PrismaService) { }

    signup() {
        
        
        return { msg: 'Sucessfully sign up' };
    }


    signin() {

        return { msg: 'Sucessfully sign in' };
    }

}