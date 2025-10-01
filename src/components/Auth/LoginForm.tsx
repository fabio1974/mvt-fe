import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useState } from "react";
import {
  FormField,
  FormInput,
  FormActions,
  FormButton,
} from "../Common/FormComponents";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setSuccess("");
    try {
      const response = await api.post<{ token: string }>("/auth/login", {
        username: data.username,
        password: data.password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 1000);
      } else {
        setError("Token não recebido. Verifique a resposta da API.");
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Erro ao fazer login."
        );
      } else {
        setError("Erro ao fazer login.");
      }
    }
  };

  return (
    <form
      style={{
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField label="E-mail" required error={errors.username?.message}>
        <FormInput
          type="email"
          placeholder="Digite seu e-mail"
          {...register("username", {
            required: "E-mail é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "E-mail inválido",
            },
          })}
        />
      </FormField>

      <FormField label="Senha" required error={errors.password?.message}>
        <FormInput
          type="password"
          placeholder="Digite sua senha"
          {...register("password", {
            required: "Senha é obrigatória",
            minLength: {
              value: 6,
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
        />
      </FormField>

      <FormActions align="center">
        <FormButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          style={{
            width: "100%",
            background: "linear-gradient(90deg, #0099ff, #006dc7)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: "1rem",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 8px 22px -6px rgba(0,153,255,0.5)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 26px -6px rgba(0,153,255,0.55)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 8px 22px -6px rgba(0,153,255,0.5)";
          }}
        >
          {isSubmitting ? "Enviando..." : "Entrar"}
        </FormButton>
      </FormActions>

      {error && (
        <div
          style={{ color: "#e74c3c", textAlign: "center", fontSize: "0.9rem" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{ color: "#0099ff", textAlign: "center", fontSize: "0.9rem" }}
        >
          {success}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.9rem" }}>
        Esqueceu sua senha?{" "}
        <a
          href="/recuperar-senha"
          style={{
            color: "#0099ff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Clique aqui.
        </a>
      </div>
    </form>
  );
}
