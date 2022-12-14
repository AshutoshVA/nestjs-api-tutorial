import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import * as argon from 'argon2';
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";

@Injectable({})
export class AuthService {

    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

    async signup(dto: AuthDto) {

        // generate the password hash
        const hash = await argon.hash(dto.password);

        // save the new user in the db 
        try {

            const user = await this.prisma.user.create({

                data: {
                    email: dto.email,
                    hash,
                },
            });

            // delete password;
           // delete user.hash;

            // return the saved user
            return this.signToken(user.id, user.email);

        } catch (error) {
            //blow logic check if user is alrrady present in db or not if present give error credentials taken
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException(
                        "Credentials taken"
                    );
                }
            }
            throw error;
        }

    }


    async signin(dto: AuthDto) {

        // find th euser by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,

            },
        });

        // if user does not exists throw exception
        if (!user) throw new ForbiddenException("cCredentials Incorrect");


        // compare password 
        const pwMatches = await argon.verify(user.hash, dto.password);

        // if password incorrect throw exception
        if (!pwMatches) throw new ForbiddenException("Incorrect Credentials");

        // send back the user
        // delete user.hash;
        return this.signToken(user.id, user.email);
    }

   async signToken(userId: number, email: string): Promise<{access_token: string}> {
        const payload = {
            sub: userId,
            email
        };

        const secret = this.config.get('JWT_SECRET');

     

        const token= await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret
        });

        return {
            access_token: token,
        };
    }

}